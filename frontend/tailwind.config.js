/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand & Accent
        'primary': '#17171c',
        'cohere-black': '#000000',
        'ink': '#212121',
        'deep-green': '#003c33',
        'dark-navy': '#071829',
        'action-blue': '#1863dc',
        'focus-blue': '#4c6ee6',
        'coral': '#ff7759',
        'coral-soft': '#ffad9b',
        'form-focus': '#9b60aa',
        'error': '#b30000',

        // Surface & Background
        'canvas': '#F9F6F0',
        'soft-stone': '#eeece7',
        'pale-green': '#edfce9',
        'pale-blue': '#f1f5ff',

        // Borders & Dividers
        'hairline': '#d9d9dd',
        'border-light': '#e5e7eb',
        'card-border': '#E2E2E2',
        'divider-soft': '#e5e7eb',

        // Text Muted
        'muted': '#93939f',
        'slate': '#75758a',
        'body-muted': '#616161',
        'ink-muted-80': '#616161',
        'ink-muted-48': '#93939f',

        // Legacy compat aliases mapped to Cohere tokens
        'surface-pearl': '#ffffff',
        'canvas-parchment': '#eeece7',
        'dark-gray': '#17171c',
        'medium-gray': '#75758a',
        'light-gray': '#ffffff',
        'accent-blue': '#1863dc',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'CohereText', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Unica77 Cohere Web"', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'CohereMono', '"Space Mono"', 'monospace', 'ui-sans-serif'],
      },
      fontSize: {
        'hero-display': ['96px', { lineHeight: '1', letterSpacing: '-1.92px', fontWeight: '400' }],
        'product-display': ['72px', { lineHeight: '1', letterSpacing: '-1.44px', fontWeight: '400' }],
        'section-display': ['60px', { lineHeight: '1', letterSpacing: '-1.2px', fontWeight: '400' }],
        'section-heading': ['48px', { lineHeight: '1.2', letterSpacing: '-0.48px', fontWeight: '400' }],
        'card-heading': ['32px', { lineHeight: '1.2', letterSpacing: '-0.32px', fontWeight: '400' }],
        'feature-heading': ['24px', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '400' }],
        'body-large': ['18px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'button': ['14px', { lineHeight: '1.71', letterSpacing: '0', fontWeight: '500' }],
        'caption': ['14px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '400' }],
        'mono-label': ['14px', { lineHeight: '1.4', letterSpacing: '0.28px', fontWeight: '400' }],
        'micro': ['12px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '400' }],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '22px',
        'xl': '30px',
        'pill': '32px',
        'full': '9999px',
      },
      spacing: {
        'xxs': '2px',
        'xs': '6px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        'xxl': '32px',
        'section': '80px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
