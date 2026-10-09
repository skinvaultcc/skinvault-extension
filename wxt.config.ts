import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	// Manifest V3 in Firefox too (WXT defaults Firefox to V2), so both
	// browsers get the same manifest shape (ADR-001).
	manifestVersion: 3
});
