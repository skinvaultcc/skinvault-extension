import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const LOCALES_DIR = join(__dirname, '../public/_locales');

function messagesOf(locale: string): Record<string, { message: string }> {
	return JSON.parse(readFileSync(join(LOCALES_DIR, locale, 'messages.json'), 'utf8'));
}

describe('locales', () => {
	const locales = readdirSync(LOCALES_DIR).sort();

	it("cover skinvault-web's seven languages, in the browsers' own locale codes", () => {
		expect(locales).toEqual(['ar', 'de', 'en', 'es', 'fr', 'pt_BR', 'pt_PT', 'zh_CN']);
	});

	it.each(locales)('%s has the same keys as English, none of them empty', (locale) => {
		const english = Object.keys(messagesOf('en')).sort();
		const messages = messagesOf(locale);

		expect(Object.keys(messages).sort()).toEqual(english);
		for (const key of english) {
			expect(messages[key]!.message.trim()).not.toBe('');
		}
	});

	// The popup can't know whether the account is linked (it keeps nothing),
	// so its ready message points to the account page instead of reading as
	// "not linked yet" (issue #8).
	it('the ready message points to the account page for the link status', () => {
		const ready = messagesOf('en').popupReady!.message;

		expect(ready).not.toMatch(/ready to link/i);
		expect(ready).toMatch(/account page/i);
	});
});
