import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                sidepanel: resolve(__dirname, "sidepanel.html")
            }
        }
    }
});