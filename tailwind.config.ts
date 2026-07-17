import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#faf5ff",100:"#f3e8ff",200:"#e9d5ff",300:"#d8b4fe",400:"#c084fc",500:"#a855f7",600:"#9333ea",700:"#7c3aed",800:"#6d28d9",900:"#5b21b6",950:"#3b0764" },
      },
      fontFamily: { sans:["var(--font-inter)","system-ui","sans-serif"] },
      animation: { "fade-in":"fadeIn 0.4s ease-out","slide-up":"slideUp 0.3s ease-out","float":"float 6s ease-in-out infinite","pulse-slow":"pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",shimmer:"shimmer 1.5s linear infinite" },
      keyframes: {
        fadeIn:   { from:{opacity:"0"},to:{opacity:"1"} },
        slideUp:  { from:{opacity:"0",transform:"translateY(8px)"},to:{opacity:"1",transform:"translateY(0)"} },
        float:    { "0%,100%":{transform:"translateY(0)"},"50%":{transform:"translateY(-16px)"} },
        shimmer:  { "0%":{backgroundPosition:"-200% 0"},"100%":{backgroundPosition:"200% 0"} },
      },
      borderRadius: { xl:"12px","2xl":"16px","3xl":"24px" },
    },
  },
  plugins: [],
};
export default config;
