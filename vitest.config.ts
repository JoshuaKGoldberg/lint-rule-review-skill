import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		coverage: {
			include: ["skills/lint-rule-review-skill/scripts"],
			reporter: ["html", "lcov"],
		},
		exclude: ["data", "dist", "eval", "node_modules", "skills"],
		setupFiles: ["console-fail-test/setup"],
	},
});
