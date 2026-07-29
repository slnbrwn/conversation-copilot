import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        outDir: "dist",
        emptyOutDir: true,

        // Prevent Vite from converting small JavaScript files
        // such as the AudioWorklet into blocked data URLs.
        assetsInlineLimit: 0,

        rollupOptions: {
            input: {
                sidepanel: resolve(
                    __dirname,
                    "sidepanel.html"
                )
            }
        }
    }
});