/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        carbon: {
          950: '#000000',
          900: '#09090B',
          850: '#121215',
          800: '#18181B',
          750: '#202024',
          700: '#27272A',
          600: '#3F3F46',
        },
        dark: {
          950: '#000000',
          900: '#09090B',
          850: '#121215',
          800: '#18181B',
          750: '#202024',
          700: '#27272A',
        },
        brand: {
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F4F4F5',
          300: '#E4E4E7',
          400: '#D4D4D8',
          500: '#FFFFFF',
          600: '#E4E4E7',
          700: '#A1A1AA',
          800: '#71717A',
          900: '#27272A',
        },
        iris: {
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#FFFFFF',
          600: '#E4E4E7',
        },
      },
      boxShadow: {
        'precision-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'precision-md': '0 4px 16px -2px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'precision-lg': '0 12px 32px -4px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        'glow-brand': '0 0 24px -4px rgba(255, 255, 255, 0.15)',
      },
      backgroundImage: {
        'subtle-mesh': 'none',
      },
    },
  },
  plugins: [],
}

