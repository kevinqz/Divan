import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
const config = {
  preprocess: [vitePreprocess({})],
  shadcn: {
    componentPath: './src/lib/components/ui'
  },
  kit: {
    alias: {
      $components: "./src/lib/components",
      "$components/*": "./src/lib/components/*"
    }
  }
};
export default config;
