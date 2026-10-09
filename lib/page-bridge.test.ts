import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXTENSION_SOURCE, PAGE_SOURCE } from './protocol';
import { startPageBridge } from './page-bridge';

// The bridge runs in the content script, on the page's own window: here the
// test's jsdom-free stand-in is a minimal EventTarget with postMessage.
class FakeWindow extends EventTarget {
	location = { origin: 'https://skinvault.cc' };
	posted: { data: unknown; targetOrigin: string }[] = [];
	postMessage(data: unknown, targetOrigin: string): void {
		this.posted.push({ data, targetOrigin });
	}
	receive(data: unknown, source: unknown = this, origin = 'https://skinvault.cc'): void {
		const event = new MessageEvent('message', { data, origin });
		Object.defineProperty(event, 'source', { value: source });
		this.dispatchEvent(event);
	}
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let stop: (() => void) | undefined;

afterEach(() => {
	stop?.();
});

function bridge(sendMessage = vi.fn().mockResolvedValue({ type: 'cancelled' })) {
	const win = new FakeWindow();
	stop = startPageBridge(win as unknown as Window, sendMessage, '1.2.3');
	return { win, sendMessage };
}

describe('page bridge', () => {
	it('announces itself to the page, to its own origin only', () => {
		const { win } = bridge();

		expect(win.posted).toEqual([
			{
				data: { source: EXTENSION_SOURCE, ready: true, version: '1.2.3' },
				targetOrigin: 'https://skinvault.cc'
			}
		]);
	});

	it("forwards the page's request and posts the reply with its id", async () => {
		const sendMessage = vi.fn().mockResolvedValue({ type: 'started', challengeUrl: 'u' });
		const { win } = bridge(sendMessage);

		win.receive({ source: PAGE_SOURCE, id: 'r1', request: { type: 'start' } });
		await flush();

		expect(sendMessage).toHaveBeenCalledWith({ type: 'start' });
		expect(win.posted.at(-1)).toEqual({
			data: {
				source: EXTENSION_SOURCE,
				id: 'r1',
				response: { type: 'started', challengeUrl: 'u' }
			},
			targetOrigin: 'https://skinvault.cc'
		});
	});

	it('ignores messages posted by another window, such as an iframe', async () => {
		const { win, sendMessage } = bridge();

		win.receive({ source: PAGE_SOURCE, id: 'r1', request: { type: 'start' } }, {});
		await flush();

		expect(sendMessage).not.toHaveBeenCalled();
	});

	it('ignores messages from another origin', async () => {
		const { win, sendMessage } = bridge();

		win.receive(
			{ source: PAGE_SOURCE, id: 'r1', request: { type: 'start' } },
			win,
			'https://evil.example'
		);
		await flush();

		expect(sendMessage).not.toHaveBeenCalled();
	});

	it("ignores messages that aren't SkinVault page requests, including its own replies", async () => {
		const { win, sendMessage } = bridge();

		win.receive({ source: EXTENSION_SOURCE, id: 'r1', response: { type: 'cancelled' } });
		win.receive({ source: PAGE_SOURCE, id: 'r1', request: { type: 'steal' } });
		win.receive({ source: PAGE_SOURCE, request: { type: 'start' } });
		win.receive('start');
		await flush();

		expect(sendMessage).not.toHaveBeenCalled();
	});

	it('posts nothing when the background script does not answer', async () => {
		const { win } = bridge(vi.fn().mockResolvedValue(undefined));
		const before = win.posted.length;

		win.receive({ source: PAGE_SOURCE, id: 'r1', request: { type: 'poll' } });
		await flush();

		expect(win.posted).toHaveLength(before);
	});

	it('answers a ping itself, with its version, for a page that missed the announcement', async () => {
		const { win, sendMessage } = bridge();

		win.receive({ source: PAGE_SOURCE, id: 'p1', request: { type: 'ping' } });
		await flush();

		expect(sendMessage).not.toHaveBeenCalled();
		expect(win.posted.at(-1)).toEqual({
			data: { source: EXTENSION_SOURCE, id: 'p1', response: { type: 'ready', version: '1.2.3' } },
			targetOrigin: 'https://skinvault.cc'
		});
	});

	it('stops listening when stopped', async () => {
		const { win, sendMessage } = bridge();
		stop?.();

		win.receive({ source: PAGE_SOURCE, id: 'r1', request: { type: 'start' } });
		await flush();

		expect(sendMessage).not.toHaveBeenCalled();
	});
});
