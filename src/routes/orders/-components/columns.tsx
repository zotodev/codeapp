import type { ColumnDef } from "@tanstack/react-table";
import type { Zap_orders } from "@/generated/models/Zap_ordersModel";

export const columns: ColumnDef<Zap_orders>[] = [
	{
		accessorKey: "zap_orderid",
		header: "Order ID",
		cell: ({ getValue }) => (
			<span className="font-mono text-xs">{getValue<string>()}</span>
		),
	},
	{
		accessorKey: "zap_id",
		header: "Custom ID",
		cell: ({ getValue }) => getValue<string>() ?? "—",
	},
	{
		accessorKey: "zap_address",
		header: "Address",
	},
	{
		accessorKey: "statecode",
		header: "Status",
		cell: ({ getValue }) => {
			const active = getValue<number>() === 0;
			return (
				<span
					className={
						active
							? "text-green-600 dark:text-green-400"
							: "text-muted-foreground"
					}
				>
					{active ? "Active" : "Inactive"}
				</span>
			);
		},
	},
	{
		accessorKey: "createdon",
		header: "Created On",
		cell: ({ getValue }) => {
			const val = getValue<string | undefined>();
			return val ? new Date(val).toLocaleDateString() : "—";
		},
	},
];
