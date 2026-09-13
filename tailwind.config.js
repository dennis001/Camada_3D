/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        camada: {
          teal:   { 50: '#e6f9f9', 100: '#b3efef', 200: '#80e5e5', 300: '#4ddede', 400: '#1acaca', 500: '#00b8b8', 600: '#009999', 700: '#007777', 800: '#005555', 900: '#003333' },
          dark:   { 50: '#f5f5f5', 100: '#e0e0e0', 200: '#bdbdbd', 300: '#9e9e9e', 400: '#757575', 500: '#616161', 600: '#424242', 700: '#2c2c2c', 800: '#1e1e1e', 900: '#121212' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}