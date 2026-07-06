import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        paper: "#f5f7f8",
        line: "#d8dee5",
        mint: "#1f9d70",
        coral: "#de5b49",
        cobalt: "#2f6fed",
        amber: "#c47f12"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
