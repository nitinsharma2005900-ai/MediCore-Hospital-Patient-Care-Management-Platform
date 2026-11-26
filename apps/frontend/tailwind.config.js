/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: { relative: true, files: ['./src/**/*.{js,ts,jsx,tsx,mdx}'] },
  theme: {
    extend: {
      colors: {
        medicore: {
          primary: '#0F766E',      // Deep Teal
          'primary-hover': '#0D655E',
          'primary-light': '#F0FDFA',
          secondary: '#2563EB',    // Medical Blue
          'secondary-hover': '#1D4ED8',
          bg: '#F8FAFC',           // Background
          card: '#FFFFFF',
          text: '#0F172A',
          muted: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
