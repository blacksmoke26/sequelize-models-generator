// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.export = tseslint.config({
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: __dirname,
    },
  },
  files: ['src/**/*.ts'],
  ignores: ['**/*.js'],
  extends: [eslint.configs.recommended, tseslint.configs.recommended],
  linterOptions: {
    noInlineConfig: true,
    reportUnusedDisableDirectives: 'warn',
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
});

console.log('module.export:', module.export);
