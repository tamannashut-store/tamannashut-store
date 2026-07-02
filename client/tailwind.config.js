/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    fontFamily: {

      sans: [
  
          "Roboto",
  
          "sans-serif"
  
      ],
  
  },
    theme: {
      extend: {
        colors: {
          brand: {
            primary: "#355E3B",
            secondary: "#A7BFA1",
            accent: "#E8DCC6",
            background: "#FAF8F4",
            dark: "#2C2C2C",
          },
        },
  
        borderRadius: {
          brand: "24px",
        },
  
        boxShadow: {
          brand: "0 10px 40px rgba(0,0,0,0.08)",
        },
      },
    },
  
    plugins: [],
  };