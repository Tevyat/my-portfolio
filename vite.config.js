import { defineConfig } from "vite";

export default defineConfig({
  base: "https://github.com/Tevyat/my-portfolio",
  build: {
    minify: "terser",
  },
});
