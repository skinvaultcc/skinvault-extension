import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLoginHandler, type Sender } from './login-handler';

const EXTENSION_ID = 'skinvault-extension-id';

function sender(overrides: Partial<Sender> = {}): Sender {
	return {
		id: EXTENSION_ID,
		url: 'https://skinvault.cc/account',
		tab: { id: 7 },
		...overrides
	};
}

function steamResponse(body: unknown, eresult = '1'): Response {
	return new Response(JSON.stringify({ response: body }), {
		headers: { 'content-type': 'application/json', 'x-eresult': eresult }
	});
}

const BEGIN = {
	client_id: '111',
	request_id: 'cmVxdWVzdA==',
	interval: 5,
	challenge_url: 'https://s.team/q/1/111'
};

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let handle: ReturnType<typeof createLoginHandler>;

beforeEach(() => {
	fetchMock = vi.fn<typeof fetch>();
	handle = createLoginHandler({
		fetch: fetchMock,
		extensionId: EXTENSION_ID,
		origins: ['https://skinvault.cc', 'https://test.skinvault.cc']
	});
});

describe('login handler: who it answers', () => {
	it('ignores a message from another extension', async () => {
		await expect(handle({ type: 'start' }, sender({ id: 'other' }))).resolves.toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('ignores a message from a page outside SkinVault', async () => {
		await expect(
			handle({ type: 'start' }, sender({ url: 'https://evil.example/account' }))
		).resolves.toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('ignores a look-alike origin', async () => {
		await expect(
			handle({ type: 'start' }, sender({ url: 'https://skinvault.cc.evil.example/' }))
		).resolves.toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('ignores a message that does not come from a tab', async () => {
		await expect(handle({ type: 'start' }, sender({ tab: undefined }))).resolves.toBeUndefined();
	});

	it('ignores anything that is not a request for it, pings included', async () => {
		await expect(handle({ type: 'steal' }, sender())).resolves.toBeUndefined();
		await expect(handle({ type: 'ping' }, sender())).resolves.toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('login handler: the login', () => {
	it('starts a login and reports its challenge', async () => {
		fetchMock.mockResolvedValueOnce(steamResponse(BEGIN));

		await expect(handle({ type: 'start' }, sender())).resolves.toEqual({
			type: 'started',
			challengeUrl: 'https://s.team/q/1/111'
		});
	});

	it('reports pending, then the rotated challenge, then the approval, with the latest client id', async () => {
		fetchMock
			.mockResolvedValueOnce(steamResponse(BEGIN))
			.mockResolvedValueOnce(steamResponse({}))
			.mockResolvedValueOnce(
				steamResponse({ new_challenge_url: 'https://s.team/q/1/222', new_client_id: '222' })
			)
			.mockResolvedValueOnce(steamResponse({ refresh_token: 'a.b.c', account_name: 'rnuncor' }));

		await handle({ type: 'start' }, sender());
		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({ type: 'pending' });
		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({
			type: 'pending',
			challengeUrl: 'https://s.team/q/1/222'
		});
		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({
			type: 'approved',
			refreshToken: 'a.b.c',
			accountName: 'rnuncor'
		});
		const lastForm = fetchMock.mock.calls[3]![1]!.body as URLSearchParams;
		expect(lastForm.get('client_id')).toBe('222');
	});

	it('forgets the login once approved', async () => {
		fetchMock
			.mockResolvedValueOnce(steamResponse(BEGIN))
			.mockResolvedValueOnce(steamResponse({ refresh_token: 'a.b.c', account_name: 'rnuncor' }));

		await handle({ type: 'start' }, sender());
		await handle({ type: 'poll' }, sender());

		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({
			type: 'failed',
			reason: 'not_started'
		});
	});

	it('reports an expired login and forgets it', async () => {
		fetchMock
			.mockResolvedValueOnce(steamResponse(BEGIN))
			.mockResolvedValueOnce(steamResponse({}, '27'));

		await handle({ type: 'start' }, sender());
		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({
			type: 'failed',
			reason: 'expired'
		});
		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({
			type: 'failed',
			reason: 'not_started'
		});
	});

	it('reports a Steam failure when the login cannot start', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

		await expect(handle({ type: 'start' }, sender())).resolves.toEqual({
			type: 'failed',
			reason: 'steam_error'
		});
	});

	it('reports not_started when polling without a login', async () => {
		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({
			type: 'failed',
			reason: 'not_started'
		});
	});

	it('keeps each tab to its own login', async () => {
		fetchMock.mockResolvedValueOnce(steamResponse(BEGIN));

		await handle({ type: 'start' }, sender());

		await expect(handle({ type: 'poll' }, sender({ tab: { id: 8 } }))).resolves.toEqual({
			type: 'failed',
			reason: 'not_started'
		});
	});

	it('drops the login on cancel', async () => {
		fetchMock.mockResolvedValueOnce(steamResponse(BEGIN));

		await handle({ type: 'start' }, sender());
		await expect(handle({ type: 'cancel' }, sender())).resolves.toEqual({ type: 'cancelled' });
		await expect(handle({ type: 'poll' }, sender())).resolves.toEqual({
			type: 'failed',
			reason: 'not_started'
		});
	});
});
