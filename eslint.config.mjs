// @ts-check

import { configs } from "@js-soft/eslint-config-ts"
import { globalIgnores } from "eslint/config"
import tseslint from "typescript-eslint"

export default tseslint.config(globalIgnores(["**/dist", "**/node_modules", "eslint.config.mjs"]), {
  extends: [configs.base],
  languageOptions: {
    parserOptions: {
      project: ["./tsconfig.json"],
    },
  },
  files: ["**/*.ts"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/naming-convention": "off",
  },
})
