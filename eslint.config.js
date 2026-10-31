import js from "@eslint/js";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "server.js", "archive/**", "server-utils/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Preserve the existing lint baseline when moving to ESLint 10.
      "no-useless-assignment": "off",
      "no-unassigned-vars": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/components/chatbot/**/*.{ts,tsx}", "src/App.tsx"],
    plugins: { "jsx-a11y": fixupPluginRules(jsxA11y) },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/no-redundant-roles": "off",
    },
  }
);

