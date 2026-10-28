// PostCSS processes our CSS during the build. The only plugin we need is Tailwind: it reads
// `@import "tailwindcss"` and `@theme` in app/globals.css and generates the utility classes (bg-brand-500,
// flex, p-4, ...). There is no tailwind.config.js in Tailwind 4: the setup lives in the CSS file.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
