/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                cream: 'var(--cream)',
                cream2: 'var(--cream2)',
                gold: 'var(--gold)',
                gold2: 'var(--gold2)',
                gold3: 'var(--gold3)',
                'gold-bg': 'var(--gold-bg)',
                ink: 'var(--ink)',
                ink2: 'var(--ink2)',
                ink3: 'var(--ink3)',
                ink4: 'var(--ink4)',
                border: 'var(--border)',
                green: 'var(--green)',
                green2: 'var(--green2)',
                'green-bg': 'var(--green-bg)',
                red: 'var(--red)',
                red2: 'var(--red2)',
                'red-bg': 'var(--red-bg)',
                ig: 'var(--ig)',
                wa: 'var(--wa)',
            },
            fontFamily: {
                display: ['Cormorant', 'serif'],
                body: ['Jost', 'sans-serif'],
                mono: ['DM Mono', 'monospace'],
            },
            borderColor: {
                DEFAULT: 'var(--border)',
            },
        },
    },
    plugins: [],
};
