/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        background: '#0B1712',
        surface: '#13221B',
        'surface-2': '#1A2C23',
        border: '#26382F',
        foreground: '#F9FAFB',
        muted: '#9CA3AF',
        primary: { DEFAULT: '#22C55E', hover: '#16A34A' },
      },
    },
  },
  plugins: [],
}
