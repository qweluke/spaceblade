module.exports = {
    '*.{ts,tsx,js,jsx}': (filenames) => {
        // Wyklucz pliki konfiguracyjne z ESLint
        const filesToLint = filenames.filter(
            (file) => !file.includes('eslint.config.js') && !file.includes('.lintstagedrc.js')
        )

        if (filesToLint.length === 0) {
            return []
        }

        return [`eslint --fix ${filesToLint.join(' ')}`, `prettier --write ${filenames.join(' ')}`]
    },
    '*.{json,css,scss,md}': ['prettier --write'],
    'eslint.config.js': ['prettier --write'],
}
