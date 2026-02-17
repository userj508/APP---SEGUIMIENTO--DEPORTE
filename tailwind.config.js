/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
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
                    DEFAULT: '#0f172a', // slate-900 (High Contrast)
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#64748b', // slate-500
                    foreground: '#ffffff',
                },
                accent: {
                    DEFAULT: '#f1f5f9', // slate-100
                    foreground: '#0f172a',
                },
                highlight: {
                    DEFAULT: '#10b981', // emerald-500 (For success/active hints)
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
        },
    },
    plugins: [],
}
