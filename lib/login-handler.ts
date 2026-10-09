import { isRequest, type Request, type Response } from './protocol';
import { beginQrLogin, pollQrLogin, type QrLogin } from './steam-login';

// The parts of runtime.MessageSender the handler checks.
export interface Sender {
	id?: string;
	url?: string;
	tab?: { id?: number };
}

interface Deps {
	fetch: typeof fetch;
	extensionId: string;
	origins: string[];
}

// The background script's side of the protocol. Answers only this
// extension's own content script, running in a tab on one of SkinVault's
// origins; anything else gets no answer (undefined). One login per tab,
// kept in memory: if the browser stops the background script between polls,
// the next poll reports not_started and the page starts again.
export function createLoginHandler(deps: Deps) {
	const logins = new Map<number, QrLogin>();

	function tabOf(sender: Sender): number | undefined {
		if (sender.id !== deps.extensionId || sender.tab?.id === undefined || !sender.url) {
			return undefined;
		}
		let origin: string;
		try {
			origin = new URL(sender.url).origin;
		} catch {
			return undefined;
		}
		return deps.origins.includes(origin) ? sender.tab.id : undefined;
	}

	async function start(tab: number): Promise<Response> {
		logins.delete(tab);
		try {
			const login = await beginQrLogin(deps.fetch);
			logins.set(tab, login);
			return { type: 'started', challengeUrl: login.challengeUrl };
		} catch {
			return { type: 'failed', reason: 'steam_error' };
		}
	}

	async function poll(tab: number): Promise<Response> {
		const login = logins.get(tab);
		if (!login) {
			return { type: 'failed', reason: 'not_started' };
		}
		try {
			const result = await pollQrLogin(deps.fetch, login);
			if (result.status === 'approved') {
				logins.delete(tab);
				return {
					type: 'approved',
					refreshToken: result.refreshToken,
					accountName: result.accountName
				};
			}
			if (result.status === 'expired') {
				logins.delete(tab);
				return { type: 'failed', reason: 'expired' };
			}
			if (result.challengeUrl) {
				logins.set(tab, { ...login, clientId: result.clientId ?? login.clientId });
				return { type: 'pending', challengeUrl: result.challengeUrl };
			}
			return { type: 'pending' };
		} catch {
			logins.delete(tab);
			return { type: 'failed', reason: 'steam_error' };
		}
	}

	return async function handle(message: unknown, sender: Sender): Promise<Response | undefined> {
		const tab = tabOf(sender);
		if (tab === undefined || !isRequest(message)) {
			return undefined;
		}
		const request: Request = message;
		if (request.type === 'start') {
			return start(tab);
		}
		if (request.type === 'poll') {
			return poll(tab);
		}
		logins.delete(tab);
		return { type: 'cancelled' };
	};
}
