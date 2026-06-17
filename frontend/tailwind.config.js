module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#000000',
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#f59e0b',
        destructive: '#ef4444',
        muted: '#f3f4f6',
        border: '#e5e7eb',
        input: '#e5e7eb',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
