/** @type {import('tailwindcss').Config} */
export default {
  // dark: vale só no tema escuro, que a pessoa escolhe no rodapé (public/tema.js); o padrão é o claro
  darkMode: ['selector', '[data-tema="escuro"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'], display: ['Bricolage Grotesque', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Cores em variáveis CSS (src/index.css): versão escura e clara, conforme o tema do aparelho
        background: 'rgb(var(--c-background) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        foreground: 'rgb(var(--c-foreground) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        primary: { DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)', hover: 'rgb(var(--c-primary-hover) / <alpha-value>)' },
        earning: 'rgb(var(--c-earning) / <alpha-value>)',
        expense: 'rgb(var(--c-expense) / <alpha-value>)',
        danger: { DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)', hover: 'rgb(var(--c-danger-hover) / <alpha-value>)' },
        investment: 'rgb(var(--c-investment) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
