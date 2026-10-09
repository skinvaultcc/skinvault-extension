import { describe, expect, it, vi } from 'vitest';
import { beginQrLogin, pollQrLogin, SteamLoginError } from './steam-login';

const API = 'https://api.steampowered.com/IAuthenticationService';

function steamResponse(body: unknown, eresult = '1'): Response {
	return new Response(JSON.stringify({ response: body }), {
		headers: { 'content-type': 'application/json', 'x-eresult': eresult }
	});
}

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

function sentForm(fetchMock: FetchMock): URLSearchParams {
	return fetchMock.mock.calls[0]![1]!.body as URLSearchParams;
}

describe('beginQrLogin', () => {
	it('starts a web browser QR login and returns its challenge and ids', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
			steamResponse({
				client_id: '111',
				request_id: 'cmVxdWVzdA==',
				interval: 5,
				challenge_url: 'https://s.team/q/1/111'
			})
		);

		await expect(beginQrLogin(fetchMock)).resolves.toEqual({
			clientId: '111',
			requestId: 'cmVxdWVzdA==',
			intervalSeconds: 5,
			challengeUrl: 'https://s.team/q/1/111'
		});
		expect(fetchMock.mock.calls[0]![0]).toBe(`${API}/BeginAuthSessionViaQR/v1/`);
		expect(fetchMock.mock.calls[0]![1]!.method).toBe('POST');
		const form = sentForm(fetchMock);
		expect(form.get('platform_type')).toBe('2');
		expect(form.get('website_id')).toBe('Community');
		expect(form.get('device_friendly_name')).toBeTruthy();
	});

	it('fails when Steam answers with an error result', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(steamResponse({}, '2'));

		await expect(beginQrLogin(fetchMock)).rejects.toBeInstanceOf(SteamLoginError);
	});

	it('fails when Steam returns no challenge', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(steamResponse({ client_id: '111' }));

		await expect(beginQrLogin(fetchMock)).rejects.toBeInstanceOf(SteamLoginError);
	});

	it('fails when Steam cannot be reached', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));

		await expect(beginQrLogin(fetchMock)).rejects.toBeInstanceOf(SteamLoginError);
	});
});

describe('pollQrLogin', () => {
	const login = { clientId: '111', requestId: 'cmVxdWVzdA==' };

	it('polls with the login ids and reports pending', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(steamResponse({ had_remote_interaction: false }));

		await expect(pollQrLogin(fetchMock, login)).resolves.toEqual({ status: 'pending' });
		expect(fetchMock.mock.calls[0]![0]).toBe(`${API}/PollAuthSessionStatus/v1/`);
		const form = sentForm(fetchMock);
		expect(form.get('client_id')).toBe('111');
		expect(form.get('request_id')).toBe('cmVxdWVzdA==');
	});

	it('reports a rotated challenge with its new client id', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				steamResponse({ new_challenge_url: 'https://s.team/q/1/222', new_client_id: '222' })
			);

		await expect(pollQrLogin(fetchMock, login)).resolves.toEqual({
			status: 'pending',
			challengeUrl: 'https://s.team/q/1/222',
			clientId: '222'
		});
	});

	it('reports the refresh token and account name once approved', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValue(
				steamResponse({ refresh_token: 'a.b.c', access_token: 'x.y.z', account_name: 'rnuncor' })
			);

		await expect(pollQrLogin(fetchMock, login)).resolves.toEqual({
			status: 'approved',
			refreshToken: 'a.b.c',
			accountName: 'rnuncor'
		});
	});

	it('reports an expired login (eresult 27)', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(steamResponse({}, '27'));

		await expect(pollQrLogin(fetchMock, login)).resolves.toEqual({ status: 'expired' });
	});

	it('fails on any other error result', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(steamResponse({}, '2'));

		await expect(pollQrLogin(fetchMock, login)).rejects.toBeInstanceOf(SteamLoginError);
	});
});
