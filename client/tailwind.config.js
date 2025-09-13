/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryDark: "#2D427A",
        primaryWhite: "#F6F6F6",
        blue1: "#5C80E4",
        blue2: "#C9EBF9",
        yellow: "#FFF7B9",
        qrcodeRed: "#E5645B",
        qrcodeRedDim: "#e5645bad",
      },
    },
  },
  plugins: [],
}

