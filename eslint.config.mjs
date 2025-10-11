import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";

export default defineConfig(
    {
        ignores: ["dist/**/*"],
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: String(import.meta.dirname),
            },
        },
    },
    js.configs.recommended,
    ts.configs.strictTypeChecked,
    ts.configs.stylisticTypeChecked,
);
