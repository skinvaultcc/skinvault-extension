import { defineConfig } from 'wxt';
import { HOST_PERMISSIONS } from './lib/permissions';

// See https://wxt.dev/api/config.html
export default defineConfig({
	// Manifest V3 in Firefox too (WXT defaults Firefox to V2), so both
	// browsers get the same manifest shape (ADR-001).
	manifestVersion: 3,
	manifest: {
		// From public/_locales, in skinvault-web's seven languages.
		default_locale: 'en',
		name: '__MSG_extName__',
		description: '__MSG_extDescription__',
		host_permissions: HOST_PERMISSIONS
	}
});
