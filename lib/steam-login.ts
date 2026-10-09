// The two Steam calls a web page can't make (CORS): starting a QR login and
// polling it. Same calls and parameters as skinvault-api's server-started
// link (steam-session's LoginSession with the WebBrowser platform), so the
// refresh token is the same kind.

const API = 'https://api.steampowered.com/IAuthenticationService';
// EAuthTokenPlatformType.WebBrowser
const WEB_BROWSER_PLATFORM = '2';
// EResult.Expired: the QR login timed out without approval.
const ERESULT_EXPIRED = '27';

export class SteamLoginError extends Error {}

export interface QrLogin {
	clientId: string;
	requestId: string;
	intervalSeconds: number;
	challengeUrl: string;
}

export type PollResult =
	| { status: 'pending'; challengeUrl?: string; clientId?: string }
	| { status: 'approved'; refreshToken: string; accountName: string }
	| { status: 'expired' };

type Fetch = typeof fetch;

async function call(
	fetchFn: Fetch,
	method: string,
	params: Record<string, string>
): Promise<{ eresult: string | null; body: Record<string, unknown> }> {
	let response: Response;
	try {
		response = await fetchFn(`${API}/${method}/v1/`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams(params)
		});
	} catch (error) {
		throw new SteamLoginError(`Steam ${method} failed: ${(error as Error).message}`);
	}
	const json = (await response.json().catch(() => null)) as {
		response?: Record<string, unknown>;
	} | null;
	return { eresult: response.headers.get('x-eresult'), body: json?.response ?? {} };
}

export async function beginQrLogin(fetchFn: Fetch): Promise<QrLogin> {
	const { eresult, body } = await call(fetchFn, 'BeginAuthSessionViaQR', {
		device_friendly_name: 'SkinVault extension',
		platform_type: WEB_BROWSER_PLATFORM,
		website_id: 'Community'
	});
	if (eresult !== '1' || typeof body.challenge_url !== 'string') {
		throw new SteamLoginError(`Steam did not start the QR login (eresult ${eresult})`);
	}
	return {
		clientId: String(body.client_id),
		requestId: String(body.request_id),
		intervalSeconds: Number(body.interval ?? 5),
		challengeUrl: body.challenge_url
	};
}

export async function pollQrLogin(
	fetchFn: Fetch,
	login: { clientId: string; requestId: string }
): Promise<PollResult> {
	const { eresult, body } = await call(fetchFn, 'PollAuthSessionStatus', {
		client_id: login.clientId,
		request_id: login.requestId
	});
	if (eresult === ERESULT_EXPIRED) {
		return { status: 'expired' };
	}
	if (eresult !== '1') {
		throw new SteamLoginError(`Steam QR login poll failed (eresult ${eresult})`);
	}
	if (typeof body.refresh_token === 'string') {
		return {
			status: 'approved',
			refreshToken: body.refresh_token,
			accountName: String(body.account_name ?? '')
		};
	}
	if (typeof body.new_challenge_url === 'string') {
		return {
			status: 'pending',
			challengeUrl: body.new_challenge_url,
			clientId: String(body.new_client_id)
		};
	}
	return { status: 'pending' };
}
