import { useTabStore, type TabType } from "./stores/tabStore";
import { AddSaleForm } from "./AddSaleForm";

const TAB_COMPONENTS: Record<
	TabType,
	React.ComponentType<{ tabId: string } & Record<string, unknown>>
> = {
	"add-sale": AddSaleForm,
};

export function TabContent() {
	const { tabs, activeTabId } = useTabStore();

	return (
		<div className="w-full">
			{tabs.map((tab) => {
				const Component = TAB_COMPONENTS[tab.type];
				if (!Component) return null;
				return (
					// Keep all tabs mounted but only show active (preserves form state!)
					<div
						key={tab.id}
						className={activeTabId === tab.id ? "block w-full" : "hidden"}
					>
						<Component tabId={tab.id} {...tab.props} />
					</div>
				);
			})}
		</div>
	);
}
