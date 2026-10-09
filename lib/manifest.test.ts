import { describe, expect, it } from 'vitest';
import config from '../wxt.config';
import { allowedOrigins } from './protocol';

describe('manifest', () => {
	const manifest = config.manifest as Record<string, unknown>;

	it("asks for host access to Steam's login API and nothing else", () => {
		expect(manifest.host_permissions).toEqual([
			'https://api.steampowered.com/IAuthenticationService/*'
		]);
		expect(manifest.permissions).toBeUndefined();
		expect(manifest.optional_permissions).toBeUndefined();
	});

	it('builds Manifest V3 for every browser', () => {
		expect(config.manifestVersion).toBe(3);
	});
});

describe("SkinVault's origins", () => {
	it('are only skinvault.cc and test.skinvault.cc in a production build', () => {
		expect(allowedOrigins(false)).toEqual(['https://skinvault.cc', 'https://test.skinvault.cc']);
	});

	it('add the local skinvault-web dev server in a development build', () => {
		expect(allowedOrigins(true)).toEqual([
			'https://skinvault.cc',
			'https://test.skinvault.cc',
			'http://localhost:5173'
		]);
	});
});
