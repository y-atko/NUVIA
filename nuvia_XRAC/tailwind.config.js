/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#101A22',
          700: '#25333D',
          500: '#4C5E68',
          300: '#8B99A1',
          100: '#D8DFE3'
        },
        mist: {
          50: '#F7F9FA',
          100: '#F0F4F5',
          200: '#E6ECEE'
        },
        nuvia: {
          50: '#EAFAF7',
          100: '#CFF3ED',
          300: '#7FDDD0',
          500: '#17A398',
          600: '#118A81',
          700: '#0D6E67'
        },
        sky: {
          500: '#2F6FED'
        },
        amber: {
          500: '#E6A23C'
        },
        coral: {
          500: '#E15B4F'
        }
      },
      fontFamily: {
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16, 26, 34, 0.04), 0 8px 24px -12px rgba(16, 26, 34, 0.10)',
        card: '0 1px 0 rgba(16, 26, 34, 0.04), 0 10px 30px -16px rgba(16, 26, 34, 0.16)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
}
