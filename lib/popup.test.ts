// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderPopup, type PopupDeps } from './popup';
import { HOST_PERMISSIONS } from './permissions';

// Returns the message key, so the tests check which text is shown without
// depending on the English wording.
const t = (key: string) => key;

let root: HTMLElement;

beforeEach(() => {
	document.body.innerHTML = '<main id="app"></main>';
	root = document.getElementById('app')!;
});

function deps(overrides: Partial<PopupDeps> = {}): PopupDeps {
	return {
		t,
		hasAccess: vi.fn().mockResolvedValue(true),
		requestAccess: vi.fn().mockResolvedValue(true),
		...overrides
	};
}

describe('popup', () => {
	it('says it is ready when the browser granted access to Steam', async () => {
		await renderPopup(root, deps());

		expect(root.textContent).toContain('popupReady');
		expect(root.querySelector('button')).toBeNull();
	});

	it('links to the account page on skinvault.cc, in a new tab, and says how linking works', async () => {
		await renderPopup(root, deps());

		const link = root.querySelector('a')!;
		expect(link.getAttribute('href')).toBe('https://skinvault.cc/account');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.textContent).toBe('popupOpenAccount');
		expect(root.textContent).toContain('popupHowTo');
	});

	it('offers to allow access when the browser has not granted it', async () => {
		await renderPopup(root, deps({ hasAccess: vi.fn().mockResolvedValue(false) }));

		expect(root.textContent).toContain('popupNeedsAccess');
		expect(root.textContent).not.toContain('popupReady');
		expect(root.querySelector('button')!.textContent).toBe('popupAllow');
	});

	it('asks for exactly its host access and shows ready once granted', async () => {
		const hasAccess = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
		const requestAccess = vi.fn().mockResolvedValue(true);
		await renderPopup(root, deps({ hasAccess, requestAccess }));

		root.querySelector('button')!.click();
		await vi.waitFor(() => expect(root.textContent).toContain('popupReady'));

		expect(requestAccess).toHaveBeenCalledWith({ origins: HOST_PERMISSIONS });
	});

	it('keeps offering access when the user refuses it', async () => {
		const requestAccess = vi.fn().mockResolvedValue(false);
		await renderPopup(root, deps({ hasAccess: vi.fn().mockResolvedValue(false), requestAccess }));

		root.querySelector('button')!.click();
		await vi.waitFor(() => expect(requestAccess).toHaveBeenCalled());

		expect(root.textContent).toContain('popupNeedsAccess');
		expect(root.querySelector('button')).not.toBeNull();
	});

	it('checks for exactly its host access', async () => {
		const hasAccess = vi.fn().mockResolvedValue(true);
		await renderPopup(root, deps({ hasAccess }));

		expect(hasAccess).toHaveBeenCalledWith({ origins: HOST_PERMISSIONS });
	});
});
