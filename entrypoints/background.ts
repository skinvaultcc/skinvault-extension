import { createLoginHandler } from '@/lib/login-handler';
import { allowedOrigins } from '@/lib/protocol';

export default defineBackground(() => {
	const handle = createLoginHandler({
		fetch: (input, init) => fetch(input, init),
		extensionId: browser.runtime.id,
		origins: allowedOrigins(import.meta.env.DEV)
	});

	// sendResponse and `return true`, rather than a returned promise, which
	// not every Chromium version supports for onMessage.
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		void handle(message, sender).then(sendResponse);
		return true;
	});
});
