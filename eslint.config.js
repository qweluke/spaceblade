const js = require('@eslint/js')
const globals = require('globals')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh')
const tseslint = require('typescript-eslint')
const prettier = require('eslint-config-prettier')

module.exports = tseslint.config(
    {
        ignores: ['dist', '.husky', 'node_modules', 'eslint.config.js', '.lintstagedrc.js'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        ignores: ['eslint.config.js', '.lintstagedrc.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2020,
            },
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    prettier // Must be last to override other configs
)
