/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'accent-blue': '#5266eb',
        'light-blue': '#9cb4e8',
        'light-purple': '#cdddff',
        'hover-state': '#5266eb29',
        'dark-gray': '#1e1e2a',
        'medium-gray': '#afb2ce',
        'light-gray': '#ededf3',
        'border-color': '#272735',
        'badge-alert': '#d03275',
        'disabled-bg': '#272735',
        'disabled-text': '#70707d',
        'input-disabled': '#f4f5f9',
      },
      fontFamily: {
        sans: ['arcadia', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['65px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '700' }],
        h1: ['42px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '700' }],
        h2: ['28px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '700' }],
        body: ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
      },
      spacing: {
        '4px': '4px',
        '8px': '8px',
        '12px': '12px',
        '16px': '16px',
        '20px': '20px',
        '24px': '24px',
        '32px': '32px',
        '40px': '40px',
        '48px': '48px',
        '64px': '64px',
        '80px': '80px',
      },
      borderRadius: {
        'sm': '4px',
        'input': '8px',
        'md': '12px',
        'primary-button': '32px',
        'lg': '40px',
      },
      screens: {
        'mobile-sm': '320px',
        'mobile-lg': '480px',
        'tablet': '768px',
        'desktop': '1024px',
        'desktop-lg': '1440px',
      },
      boxShadow: {
        'card': 'rgba(0, 0, 0, 0.05) 0px 8px 12px',
      }
    },
  },
  plugins: [],
}
