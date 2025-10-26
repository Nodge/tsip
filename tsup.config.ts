import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts", "src/tests.ts"],
    format: ["esm", "cjs"],
    target: "es2020",
    splitting: false,
    dts: { resolve: true },
    sourcemap: true,
    clean: true,
    treeshake: true,
});
