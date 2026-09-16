/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1B17',
        paper: '#F7F5EE',
        canvas: '#FAFAF7',
        line: '#DAD5C6',
        line2: '#E8E4D8',
        bottle: {
          50: '#EEF3EE',
          100: '#D3E0D5',
          400: '#3B6249',
          600: '#1F3D2B',
          700: '#182F21',
          900: '#0F1F16',
        },
        brass: {
          400: '#C79A3E',
          500: '#A87C2E',
          600: '#8A6423',
        },
        clay: '#8C2F2F',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        doc: '0 1px 2px rgba(28,27,23,0.06), 0 8px 24px rgba(28,27,23,0.08)',
      },
      borderRadius: {
        sm2: '3px',
      },
    },
  },
  plugins: [],
}
