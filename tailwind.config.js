/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.njk", "./src/**/*.md", "./src/**/*.js"],
  theme: {
    extend: {
      maxWidth: {
        'site': '1800px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
};
