import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTabStore } from "./stores/tabStore";
import { cn } from "@/lib/utils";

export function TabBar() {
	const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

	if (tabs.length === 0) return null;

	return (
		<div className="border-b bg-muted/40">
			<ScrollArea className="w-full">
				<div className="flex">
					{tabs.map((tab) => {
						const isActive = activeTabId === tab.id;
						return (
							<button
								key={tab.id}
								id={`tab-trigger-${tab.id}`}
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									"group relative flex items-center gap-2 px-4 py-2.5 text-sm",
									"border-r border-border/50 min-w-[140px] max-w-[200px]",
									"transition-colors select-none shrink-0 focus-visible:outline-none",
									isActive
										? "bg-background text-foreground font-medium"
										: "text-muted-foreground hover:text-foreground hover:bg-background/60"
								)}
							>
								{/* Active indicator line */}
								{isActive && (
									<span className="absolute inset-x-0 top-0 h-0.5 bg-primary rounded-b" />
								)}

								<span className="truncate flex-1 text-left">
									{tab.isDirty && (
										<span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5 mb-0.5" />
									)}
									{tab.title}
								</span>

								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 rounded-sm"
									id={`tab-close-${tab.id}`}
									onClick={(e) => {
										e.stopPropagation();
										closeTab(tab.id);
									}}
								>
									<X className="h-3 w-3" />
								</Button>
							</button>
						);
					})}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}
