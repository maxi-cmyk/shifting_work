import js from '@eslint/js';

export default [
  { ignores: ['dist/', 'node_modules/', '.vite/', '**/*.{ts,tsx}'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        module: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        global: 'readonly',
      },
    },
  },
];
