module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.app.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended-type-checked"],
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    ...require("eslint-plugin-react-hooks").configs.recommended.rules,
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  },
};

