import {
	EXTENSION_SOURCE,
	isPageRequest,
	PAGE_SOURCE,
	type ExtensionMessage,
	type Request,
	type Response
} from './protocol';

type SendMessage = (request: Request) => Promise<Response | undefined>;

// The content script's side: carries requests from SkinVault's page to the
// background script and the replies back. It accepts only messages the page
// posted to itself (same window, same origin) and tagged as SkinVault's,
// and posts only to the page's own origin, so neither an embedded frame nor
// another site can talk to it or read what it posts. Returns a function
// that stops it.
export function startPageBridge(
	win: Window,
	sendMessage: SendMessage,
	version: string
): () => void {
	const origin = win.location.origin;

	function post(message: ExtensionMessage): void {
		win.postMessage(message, origin);
	}

	async function onMessage(event: MessageEvent): Promise<void> {
		if (event.source !== win || event.origin !== origin) {
			return;
		}
		const data = event.data as { source?: unknown; id?: unknown; request?: unknown } | null;
		if (
			data?.source !== PAGE_SOURCE ||
			typeof data.id !== 'string' ||
			!isPageRequest(data.request)
		) {
			return;
		}
		const response =
			data.request.type === 'ping'
				? ({ type: 'ready', version } as const)
				: await sendMessage(data.request);
		if (response) {
			post({ source: EXTENSION_SOURCE, id: data.id, response });
		}
	}

	const listener = (event: Event) => void onMessage(event as MessageEvent);
	win.addEventListener('message', listener);
	post({ source: EXTENSION_SOURCE, ready: true, version });
	return () => win.removeEventListener('message', listener);
}
