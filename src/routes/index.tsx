import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/components/page-header";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div>
			<PageHeader
				label="Welcome Home"
				description="This is the home page. Use the navigation above to explore the app."
			/>
		</div>
	);
}
