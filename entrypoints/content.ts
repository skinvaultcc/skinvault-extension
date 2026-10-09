import { startPageBridge } from '@/lib/page-bridge';
import { allowedOrigins, type Request, type Response } from '@/lib/protocol';

export default defineContentScript({
	matches: allowedOrigins(import.meta.env.DEV).map((origin) => `${origin}/*`),
	main() {
		startPageBridge(
			window,
			(request: Request) => browser.runtime.sendMessage(request) as Promise<Response | undefined>,
			browser.runtime.getManifest().version
		);
	}
});
