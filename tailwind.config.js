/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eaf7f5",
          100: "#d4efeb",
          200: "#aae0d9",
          300: "#78cdc2",
          400: "#42b2a6",
          500: "#218f85",
          600: "#0f766e",
          700: "#0d5f5a",
          800: "#114d49",
          900: "#123f3d",
          950: "#082827",
        },
        accent: {
          50: "#fdf3ef",
          100: "#f9e3db",
          200: "#f3c4b4",
          300: "#eaa084",
          400: "#df7b5d",
          500: "#d9684a",
          600: "#b94b34",
          700: "#973b2a",
          800: "#7d3328",
          900: "#682f27",
        },
        canvas: "#fbf8f3",
        ink: "#1f2d2d",
      },
      fontFamily: {
        sans: ['"Manrope Variable"', "Manrope", '"PingFang HK"', '"Microsoft JhengHei"', '"Noto Sans TC"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(31, 45, 45, 0.28)",
        card: "0 12px 30px -18px rgba(31, 45, 45, 0.22)",
      },
    },
  },
  plugins: [],
}
