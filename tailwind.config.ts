import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                // CineTier Custom Colors
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // CineTier Brand Colors
                neon: {
                    DEFAULT: "#B8FF4A",
                    hover: "#9CFF1A",
                    pressed: "#7BE600",
                },
                turquoise: {
                    DEFAULT: "#00F5D4",
                    hover: "#00E6FF",
                    glow: "rgba(0, 245, 212, 0.26)",
                },
                surface: {
                    1: "#0E2A1D",
                    2: "#123324",
                },
                cinetier: {
                    bg: {
                        0: "#050B08",
                        1: "#07130E",
                        2: "#0B1F16",
                    },
                    text: {
                        primary: "#E9FFF4",
                        muted: "#A7D6C1",
                        disabled: "#6E9B88",
                    },
                    border: "#1E4A34",
                    warning: "#FFD166",
                    danger: "#FF4D6D",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                poster: "16px",
                card: "18px",
            },
            boxShadow: {
                "glow-sm": "0 0 12px rgba(0, 245, 212, 0.18)",
                "glow-md": "0 0 24px rgba(0, 245, 212, 0.26)",
                "glow-xl": "0 0 44px rgba(184, 255, 74, 0.18)",
                "glow-neon": "0 0 20px rgba(184, 255, 74, 0.3)",
                "glow-turquoise": "0 0 20px rgba(0, 245, 212, 0.3)",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
                display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                pop: {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.05)" },
                    "100%": { transform: "scale(1)" },
                },
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 12px rgba(0, 245, 212, 0.18)" },
                    "50%": { boxShadow: "0 0 24px rgba(0, 245, 212, 0.36)" },
                },
                "slide-up": {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "slide-down": {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                shimmer: "shimmer 2s linear infinite",
                float: "float 6s ease-in-out infinite",
                pop: "pop 0.2s ease-out",
                "pulse-glow": "pulse-glow 2s ease-in-out infinite",
                "slide-up": "slide-up 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)",
                "slide-down": "slide-down 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)",
                "fade-in": "fade-in 0.18s ease-out",
            },
            transitionDuration: {
                fast: "120ms",
                normal: "180ms",
                slow: "260ms",
            },
            transitionTimingFunction: {
                snappy: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
