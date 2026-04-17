import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Zap_orders } from "@/generated/models/Zap_ordersModel";
import { Zap_ordersService } from "@/generated/services/Zap_ordersService";

export const Route = createFileRoute("/orders/list")({
	component: OrdersListPage,
});

function OrdersListPage() {
	const [orders, setOrders] = useState<Zap_orders[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchOrders() {
			setLoading(true);
			const result = await Zap_ordersService.getAll({
				select: [
					"zap_orderid",
					"zap_id",
					"zap_address",
					"createdon",
					"statecode",
				],
				orderBy: ["createdon desc"],
				top: 10,
			});
			setLoading(false);
			if (result.error) {
				setError(result.error.message);
			} else {
				setOrders(result.data ?? []);
			}
		}
		fetchOrders();
	}, []);

	return (
		<div className="p-6">
			<div className="flex items-start justify-between">
				<PageHeader
					label="Orders"
					description="Showing the latest 10 orders from Dataverse."
				/>
				<Button asChild size="sm" className="mt-1">
					<Link to="/orders/create">
						<PlusIcon className="mr-1 size-4" />
						New Order
					</Link>
				</Button>
			</div>

			{error && <p className="mt-4 text-sm text-destructive">{error}</p>}

			<div className="mt-6 rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Order ID</TableHead>
							<TableHead>Custom ID</TableHead>
							<TableHead>Address</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created On</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							["r0", "r1", "r2", "r3", "r4"].map((rowKey) => (
								<TableRow key={rowKey}>
									{["c0", "c1", "c2", "c3", "c4"].map((colKey) => (
										<TableCell key={colKey}>
											<Skeleton className="h-4 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : orders.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="py-8 text-center text-muted-foreground"
								>
									No orders found.
								</TableCell>
							</TableRow>
						) : (
							orders.map((order) => (
								<TableRow key={order.zap_orderid}>
									<TableCell className="font-mono text-xs">
										{order.zap_orderid}
									</TableCell>
									<TableCell>{order.zap_id ?? "—"}</TableCell>
									<TableCell>{order.zap_address}</TableCell>
									<TableCell>
										<span
											className={
												order.statecode === 0
													? "text-green-600 dark:text-green-400"
													: "text-muted-foreground"
											}
										>
											{order.statecode === 0 ? "Active" : "Inactive"}
										</span>
									</TableCell>
									<TableCell>
										{order.createdon
											? new Date(order.createdon).toLocaleDateString()
											: "—"}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
