import type { KnipConfig } from "knip";

export default {
	entry: ["skills/**/scripts/*.mjs", "src/**/*.test.*"],
	ignore: ["skills/lint-rule-review/assets/**"],
	ignoreExportsUsedInFile: { interface: true, type: true },
	project: ["skills/**/scripts/*.mjs", "src/**/*.ts"],
	treatConfigHintsAsErrors: true,
} satisfies KnipConfig;
