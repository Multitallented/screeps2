module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript"
  ],
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module"
  },
  plugins: ["import"],
  settings: {
    "import/resolver": {
      typescript: {}
    }
  },
  rules: {
    "arrow-parens": ["off", "as-needed"],
    camelcase: "error",
    complexity: "off",
    "dot-notation": "error",
    "eol-last": "off",
    eqeqeq: ["error", "smart"],
    "guard-for-in": "off",
    "id-blacklist": ["error", "any", "Number", "number", "String", "string", "Boolean", "boolean", "Undefined"],
    "id-match": "error",
    "linebreak-style": "off",
    "max-classes-per-file": ["error", 1],
    "new-parens": "off",
    "newline-per-chained-call": "off",
    "no-bitwise": "error",
    "no-prototype-builtins": "off",
    "no-caller": "error",
    "no-cond-assign": "error",
    "no-console": "off",
    "no-eval": "error",
    "no-invalid-this": "off",
    "no-multiple-empty-lines": "off",
    "no-new-wrappers": "error",
    "no-shadow": "off",
    "no-throw-literal": "error",
    "no-trailing-spaces": "off",
    "no-undef-init": "error",
    "no-underscore-dangle": "warn",
    "no-var": "error",
    "object-shorthand": "error",
    "one-var": ["error", "never"],
    "quote-props": "off",
    radix: "error",
    "sort-imports": "warn",
    "spaced-comment": "error",
  }
};
