/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Mulish', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0D0F12',
        surface: '#15181D',
        'surface-2': '#1C2026',
        border: '#272C34',
        foreground: '#ECEEF1',
        muted: '#8D939D',
        primary: { DEFAULT: '#55B02E', hover: '#4A9A28' },
        earning: '#55B02E',
        // texto vermelho mais claro para ter contraste suficiente no fundo escuro (WCAG AA)
        expense: '#F25C5C',
        danger: { DEFAULT: '#C62828', hover: '#B71C1C' },
        investment: '#3B82F6',
      },
    },
  },
  plugins: [],
}
