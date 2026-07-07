import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Excludes generated files — e.g. lib/database.types.ts (from
    // `supabase gen types`) is machine-written and not a candidate for
    // splitting. Add other generated paths here as they show up.
    ignores: ["lib/database.types.ts"],
    rules: {
      // Nudge oversized files toward being split into smaller components.
      // A warning, not an error, so existing large views don't block CI while
      // they're being broken up. Blank lines and comments don't count.
      "max-lines": [
        "warn",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
