/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
        headings: ["Montserrat", "sans-serif"],
      },
      colors: {
        homeroom_bg: "#f8f9fa", // A light, clean background for lesson content
        // Add other custom colors for the platform
      },
    },
  },
  plugins: [],
};
