/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand & Accent
        primary: "var(--color-primary)",
        "primary-focus": "var(--color-primary-focus)",
        "primary-on-dark": "var(--color-primary-on-dark)",
        
        // Text
        ink: "var(--color-ink)",
        body: "var(--color-body)",
        "body-on-dark": "var(--color-body-on-dark)",
        "body-muted": "var(--color-body-muted)",
        "ink-muted-80": "var(--color-ink-muted-80)",
        "ink-muted-48": "var(--color-ink-muted-48)",
        
        // Backgrounds & Surfaces
        canvas: "var(--color-canvas)",
        "canvas-parchment": "var(--color-canvas-parchment)",
        "surface-pearl": "var(--color-surface-pearl)",
        "surface-tile-1": "var(--color-surface-tile-1)",
        "surface-tile-2": "var(--color-surface-tile-2)",
        "surface-tile-3": "var(--color-surface-tile-3)",
        "surface-black": "var(--color-surface-black)",
        "surface-chip-translucent": "var(--color-surface-chip-translucent)",
        
        // Borders
        "divider-soft": "var(--color-divider-soft)",
        hairline: "var(--color-hairline)",
      },
      fontFamily: {
        display: ['"Sofia Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Sofia Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.374px',
        tighter: '-0.28px',
        tight: '-0.224px',
        normal: '0px',
        wide: '0.196px',
        wider: '0.231px',
      },
      lineHeight: {
        tightest: '1.0',
        hero: '1.07',
        display: '1.10',
        tight: '1.14',
        tagline: '1.19',
        body: '1.47',
        relaxed: '1.5',
        loose: '2.41',
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '17px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '80px',
      },
      borderRadius: {
        none: '0px',
        xs: '5px',
        sm: '8px',
        md: '11px',
        lg: '18px',
        pill: '9999px',
        full: '9999px',
      },
      boxShadow: {
        product: '0 30px 60px rgba(0, 0, 0, 0.22)',
      }
    },
  },
  plugins: [],
}
