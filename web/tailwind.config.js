/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0B1712',
        surface: '#13221B',
        'surface-2': '#1A2C23',
        border: '#26382F',
        foreground: '#F9FAFB',
        muted: '#9CA3AF',
        primary: { DEFAULT: '#22C55E', hover: '#16A34A' },
        earning: '#22C55E',
        // texto vermelho mais claro para ter contraste suficiente no fundo escuro (WCAG AA)
        expense: '#F25C5C',
        danger: { DEFAULT: '#C62828', hover: '#B71C1C' },
        // azul mais claro: o #3B82F6 ficava abaixo de 4,5:1 sobre o fundo verde-escuro novo (WCAG AA)
        investment: '#60A5FA',
      },
    },
  },
  plugins: [],
}
