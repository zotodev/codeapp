import path from "node:path";
import { powerApps } from "@microsoft/power-apps-vite/plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		powerApps(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
