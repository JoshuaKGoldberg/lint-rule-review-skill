import type { KnipConfig } from "knip";

export default {
	entry: ["skills/**/scripts/*.ts", "src/**/*.test.*"],
	ignore: ["skills/lint-rule-review/assets/**"],
	ignoreExportsUsedInFile: { interface: true, type: true },
	project: ["skills/**/scripts/*.ts", "src/**/*.ts"],
	treatConfigHintsAsErrors: true,
} satisfies KnipConfig;
