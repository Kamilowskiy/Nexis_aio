/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5b9dff',
          dark: '#4a7ba7',
        },
        background: {
          DEFAULT: '#15161b',
          elevated: '#1c1d24',
        },
      },
      textColor: {
        white: {
          DEFAULT: '#ffffff',
          87: 'rgba(255, 255, 255, 0.87)',
          60: 'rgba(255, 255, 255, 0.6)',
          40: 'rgba(255, 255, 255, 0.4)',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'modal-slide': 'modalSlide 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(400px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        modalSlide: {
          '0%': { transform: 'translateY(-50px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}