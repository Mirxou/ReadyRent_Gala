import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "behavior_layer/**",
    // Non-app code: skills, mini-services, examples have their own tooling
    "skills/**",
    "mini-services/**",
    "examples/**",
    // Generated / vendor
    "node_modules/**",
    ".zscripts/**",
  ]),
  {
    rules: {
      // Conventional: allow underscore-prefixed unused vars
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // Security: disallow console.log in production code
      'no-console': ['warn', {
        allow: ['warn', 'error'],
      }],
    },
  },
]);

export default eslintConfig;
