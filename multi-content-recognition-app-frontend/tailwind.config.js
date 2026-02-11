/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{ts,tsx}', './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F7FAFC',
        primary: '#1D4ED8',
        primarySoft: '#E0ECFF',
        accent: '#0EA5E9',
        surface: '#FFFFFF',
        surfaceMuted: '#F1F5F9',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        danger: '#EF4444'
      },
      borderRadius: {
        xl: '1.25rem'
      },
      shadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

