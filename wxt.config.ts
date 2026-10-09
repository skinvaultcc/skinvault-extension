import { defineConfig } from 'wxt';

// Host access to Steam's login API only (skinvault-api's ADR-023): the two
// calls a web page can't make. Browsers grant host permissions per host, so
// the path documents intent rather than narrowing the grant.
export const HOST_PERMISSIONS = ['https://api.steampowered.com/IAuthenticationService/*'];

// See https://wxt.dev/api/config.html
export default defineConfig({
	// Manifest V3 in Firefox too (WXT defaults Firefox to V2), so both
	// browsers get the same manifest shape (ADR-001).
	manifestVersion: 3,
	manifest: {
		name: 'SkinVault',
		host_permissions: HOST_PERMISSIONS
	}
});
