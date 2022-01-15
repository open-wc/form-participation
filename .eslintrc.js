module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['simple-import-sort', '@typescript-eslint'],
  extends: [ require.resolve('@open-wc/eslint-config'), require.resolve('eslint-config-prettier')],
  rules: {
    'lit/no-useless-template-literals': 'off',
    'consistent-return': 'off',
    'max-classes-per-file': 'off'
  }
};
