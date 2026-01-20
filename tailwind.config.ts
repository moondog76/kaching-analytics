import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        chart: {
          blue: '#3B82F6',
          teal: '#2DD4BF',
          yellow: '#FBBF24',
          orange: '#FB923C',
          coral: '#F87171',
          purple: '#A78BFA',
          pink: '#F472B6',
          cyan: '#22D3EE',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05)',
        'elevated': '0 4px 12px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
export default config
