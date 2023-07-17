import {vitePreprocess} from "@sveltejs/vite-plugin-svelte";
const config = {
  preprocess: [vitePreprocess({})],
  shadcn: {
    componentPath: './src/lib/components/ui'
  }
};
export default config;
