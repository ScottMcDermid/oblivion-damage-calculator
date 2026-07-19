import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        error: 'var(--color-error)',
        ghost: 'var(--color-ghost)',
      },
      maxWidth: {
        '8xl': '90rem', // 1440px
        '9xl': '100rem', // 1600px
        '10xl': '120rem', // 1920px
      },
      width: {
        '8xl': '90rem',
        '9xl': '100rem',
        '10xl': '120rem',
      },
    },
  },
  important: '#root',
  corePlugins: {
    preflight: true,
  },
  plugins: [],
};
export default config;
