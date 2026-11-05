import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		coverage: {
			include: ["skills/lint-rule-review/scripts"],
			reporter: ["html", "lcov"],
		},
		exclude: ["dist", "node_modules", "skills"],
		setupFiles: ["console-fail-test/setup"],
	},
});
