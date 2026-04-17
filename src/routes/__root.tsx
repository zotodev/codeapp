import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Link,
	Outlet,
	useRouter,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/Header";
import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	component: RootLayout,
	notFoundComponent: NotFound,
	errorComponent: GlobalError,
});

function RootLayout() {
	return (
		<div className="flex h-screen">
			<SidebarProvider>
				<AppSidebar />
				<div className="flex min-w-0 flex-1 flex-col">
					<Header />
					<div className="pt-14">
						<main className="h-full">
							<Outlet />
						</main>
					</div>
				</div>
			</SidebarProvider>
		</div>
	);
}

function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
			<h1 className="text-6xl font-bold">404</h1>
			<p className="text-muted-foreground text-lg">Page not found</p>
			<Link to="/" className="text-sm underline underline-offset-4">
				Go home
			</Link>
		</div>
	);
}

function GlobalError({ error }: { error: Error }) {
	const router = useRouter();
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
			<h2 className="text-2xl font-bold">Something went wrong</h2>
			<p className="text-muted-foreground text-sm max-w-sm">{error.message}</p>
			<button
				type="button"
				className="text-sm underline underline-offset-4"
				onClick={() => router.invalidate()}
			>
				Try again
			</button>
		</div>
	);
}
