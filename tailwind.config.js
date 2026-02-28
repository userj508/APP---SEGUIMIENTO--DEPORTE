/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                sikan: {
                    cream: '#FAF9F6', // Off-white warm / Beige suave
                    green: '#2A3A2F', // Deep Green Forest / Military Green elegant
                    gold: '#C9BCA2', // Beige / Light Gold suave
                    dark: '#1C1E1C', // Deep Carbon / Dark Grey
                },
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                primary: {
                    DEFAULT: '#2A3A2F',
                    foreground: '#FAF9F6',
                },
                secondary: {
                    DEFAULT: '#C9BCA2',
                    foreground: '#2A3A2F',
                },
                accent: {
                    DEFAULT: '#FAF9F6',
                    foreground: '#2A3A2F',
                },
                highlight: {
                    DEFAULT: '#2A3A2F',
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                serif: ['Playfair Display', 'ui-serif', 'Georgia', 'serif'],
            },
        },
    },
    plugins: [],
}
