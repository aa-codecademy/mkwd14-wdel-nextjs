// PostCSS processes our CSS during the build. The only plugin we need is
// Tailwind: it reads `@import "tailwindcss"` and `@theme` in globals.css and
// generates the utility classes.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
