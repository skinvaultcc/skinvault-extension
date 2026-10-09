// The messages between SkinVault's page, the content script and the
// background script (docs/ARCHITECTURE.md, Protocol).

// Tags on window.postMessage data, so each side ignores everything else the
// page posts.
export const PAGE_SOURCE = 'skinvault-page';
export const EXTENSION_SOURCE = 'skinvault-extension';

// What the background script handles.
export type Request = { type: 'start' } | { type: 'poll' } | { type: 'cancel' };

// What the page may send: the background's requests, and a ping the content
// script answers itself.
export type PageRequest = Request | { type: 'ping' };

export type FailureReason = 'expired' | 'steam_error' | 'not_started';

export type Response =
	| { type: 'started'; challengeUrl: string }
	| { type: 'pending'; challengeUrl?: string }
	| { type: 'approved'; refreshToken: string; accountName: string }
	| { type: 'cancelled' }
	| { type: 'ready'; version: string }
	| { type: 'failed'; reason: FailureReason };

// What the page posts: a request with its own id, echoed in the reply.
export interface PageMessage {
	source: typeof PAGE_SOURCE;
	id: string;
	request: PageRequest;
}

// What the content script posts back: the reply to a request, or the
// announcement that the extension is there.
export type ExtensionMessage =
	| { source: typeof EXTENSION_SOURCE; id: string; response: Response }
	| { source: typeof EXTENSION_SOURCE; ready: true; version: string };

// SkinVault's origins, the only ones the extension talks to. The local
// skinvault-web dev server is added in development builds only.
export const PRODUCTION_ORIGINS = ['https://skinvault.cc', 'https://test.skinvault.cc'];
export const DEVELOPMENT_ORIGINS = ['http://localhost:5173'];

export function allowedOrigins(isDevelopment: boolean): string[] {
	return isDevelopment ? [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS] : PRODUCTION_ORIGINS;
}

function typeOf(value: unknown): unknown {
	return (value as { type?: unknown } | null)?.type;
}

export function isRequest(value: unknown): value is Request {
	const type = typeOf(value);
	return type === 'start' || type === 'poll' || type === 'cancel';
}

export function isPageRequest(value: unknown): value is PageRequest {
	return isRequest(value) || typeOf(value) === 'ping';
}
