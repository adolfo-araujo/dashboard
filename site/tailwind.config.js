/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        background: '#0D0F12',
        surface: '#15181D',
        'surface-2': '#1C2026',
        border: '#272C34',
        foreground: '#F9FAFB',
        muted: '#9CA3AF',
        primary: { DEFAULT: '#22C55E', hover: '#16A34A' },
      },
    },
  },
  plugins: [],
}
