module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './packages/*/core/tsconfig.json']
  },
  plugins: ['simple-import-sort', '@typescript-eslint'],
  extends: [
    require.resolve('@open-wc/eslint-config'),
    require.resolve('eslint-config-prettier'),
  ],
  extends: [
    'plugin:@typescript-eslint/recommended', 'prettier', '@open-wc/eslint-config', 'eslint-config-prettier'
  ],
  rules: {
    'lit/no-useless-template-literals': 'off',
    'consistent-return': 'off',
    'max-classes-per-file': 'off',
  }
};