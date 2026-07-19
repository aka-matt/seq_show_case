/** @type {import('prettier').Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  plugins: [],
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
  ],
};
