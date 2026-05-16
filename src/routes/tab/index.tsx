import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTabStore } from "./-components/stores/tabStore";
import { TabBar } from "./-components/TabBar";
import { TabContent } from "./-components/TabContent";

export const Route = createFileRoute("/tab/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col h-full">
			{/* Sticky header + tab bar */}
			<div className="sticky top-0 z-10 bg-background">
				<PageHeader />
				<TabBar />
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-auto">
				<TabContent />
			</div>
		</div>
	);
}

function PageHeader() {
	const { openTab, tabs } = useTabStore();

	return (
		<>
			<div className="flex items-center justify-between px-6 py-4">
				<div className="space-y-0.5">
					<h1 className="text-xl font-semibold tracking-tight">Sales</h1>
					<p className="text-sm text-muted-foreground">
						{tabs.length === 0
							? "No open tabs"
							: `${tabs.length} tab${tabs.length > 1 ? "s" : ""} open`}
					</p>
				</div>
				<Button
					id="open-add-sale-tab"
					size="sm"
					onClick={() =>
						openTab({
							type: "add-sale",
							title: "New Sale",
							props: {},
						})
					}
				>
					<Plus className="h-4 w-4 mr-1.5" />
					Add Sale
				</Button>
			</div>
			<Separator />
		</>
	);
}
