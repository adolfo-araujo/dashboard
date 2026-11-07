/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        // Cores em variáveis CSS (src/index.css): versão escura e clara, conforme o tema do aparelho
        background: 'rgb(var(--c-background) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        foreground: 'rgb(var(--c-foreground) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        primary: { DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)', hover: 'rgb(var(--c-primary-hover) / <alpha-value>)' },
      },
    },
  },
  plugins: [],
}
