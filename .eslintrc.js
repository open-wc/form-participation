module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['simple-import-sort', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    'lit/no-useless-template-literals': 'off',
    'consistent-return': 'off',
    'max-classes-per-file': 'off',
    'no-prototype-builtins': 'off'
  }
};
