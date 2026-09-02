import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        arc: {
          bg: "#f8f7f3",
          ink: "#161616",
          muted: "#6f6a61",
          line: "#e8e2d8",
          purple: "#6b2bd9",
          cyan: "#55ead4",
          lime: "#b8ff42"
        }
      }
    }
  },
  plugins: []
};
export default config;
