import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "./lib/queryClient";
import { Providers } from "./providers/Providers";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const router = createRouter({
	routeTree,
	context: {
		queryClient,
	},
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<Providers>
			<RouterProvider router={router} />
		</Providers>
	</StrictMode>,
);
