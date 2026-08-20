/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#232333',
        },
        primary: {
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
        },
        accent: {
          500: '#8b5cf6',
          400: '#a78bfa',
          300: '#c4b5fd',
        }
      },
      animation: {
        'glow-pulse': 'glow 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.2), 0 0 20px rgba(139, 92, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.6)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [
    require('tailwindcss-3d')({ legacy: true }),
  ],
}
