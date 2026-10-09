import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// WxtVitest gives the tests WXT's auto-imports and an in-memory `browser`
// (@webext-core/fake-browser), so entrypoint logic runs without a real one.
export default defineConfig({
	plugins: [WxtVitest()],
	test: { passWithNoTests: true }
});
