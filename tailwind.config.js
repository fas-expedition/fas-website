/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.njk", "./src/**/*.md"],
  theme: {
    extend: {
      maxWidth: {
        'site': '1800px'
      }
    }
  },
  plugins: []
};
