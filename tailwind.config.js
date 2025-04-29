/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        core: {
          DEFAULT: 'hsl(184.62, 69.15%, 36.86%)',
          50: 'hsl(184.62, 69.15%, 95%)',
          100: 'hsl(184.62, 69.15%, 90%)',
          200: 'hsl(184.62, 69.15%, 80%)',
          300: 'hsl(184.62, 69.15%, 70%)',
          400: 'hsl(184.62, 69.15%, 50%)',
          500: 'hsl(184.62, 69.15%, 36.86%)', // Main core color
          600: 'hsl(184.62, 69.15%, 30%)',
          700: 'hsl(184.62, 69.15%, 25%)',
          800: 'hsl(184.62, 69.15%, 20%)',
          900: 'hsl(184.62, 69.15%, 15%)',
          950: 'hsl(184.62, 69.15%, 10%)',
        }
      },
    },
  },
  plugins: [],
}