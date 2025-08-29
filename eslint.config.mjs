import canvaPlugin from "@canva/app-eslint-plugin";

export default [
  {
    ignores: [
      "**/node_modules/",
      "**/dist",
      "**/*.d.ts",
      "**/*.d.tsx",
      "**/*.config.*",
      "**/supabase/**",
      "**/utils/testing/**",
    ],
  },
  ...canvaPlugin.configs.apps,
];
