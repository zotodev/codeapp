import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Zap_orders } from "@/generated/models/Zap_ordersModel";
import { Zap_ordersService } from "@/generated/services/Zap_ordersService";

export const Route = createFileRoute("/orders/$orderId")({
	component: OrderDetailPage,
});

function OrderDetailPage() {
	const { orderId } = useParams({ from: "/orders/$orderId" });
	const [order, setOrder] = useState<Zap_orders | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!orderId) {
			setError("No order ID provided.");
			setLoading(false);
			return;
		}

		// Basic GUID validation
		const guidPattern =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!guidPattern.test(orderId)) {
			setError(
				`Invalid order ID: "${orderId}". Expected a valid GUID (e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).`,
			);
			setLoading(false);
			return;
		}

		async function fetchOrder() {
			setLoading(true);
			setError(null);
			const result = await Zap_ordersService.get(orderId);
			setLoading(false);
			if (result.error) {
				setError(result.error.message);
			} else if (!result.data) {
				setError(`Order with ID "${orderId}" was not found.`);
			} else {
				setOrder(result.data);
			}
		}

		fetchOrder();
	}, [orderId]);

	return (
		<div className="p-6 max-w-2xl mx-auto">
			<div className="mb-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/orders/list">
						<ArrowLeftIcon className="mr-1 size-4" />
						Back to Orders
					</Link>
				</Button>
			</div>

			<PageHeader
				label="Order Detail"
				description={`Viewing details for order ID: ${orderId}`}
			/>

			<div className="mt-6">
				{loading && (
					<div className="space-y-2 rounded-md border p-4">
						{["sk1", "sk2", "sk3", "sk4", "sk5"].map((key) => (
							<Skeleton key={key} className="h-5 w-full" />
						))}
					</div>
				)}

				{!loading && error && (
					<div className="rounded-md border border-destructive bg-destructive/10 p-4">
						<p className="text-sm font-medium text-destructive">Error</p>
						<p className="mt-1 text-sm text-destructive/80">{error}</p>
					</div>
				)}

				{!loading && !error && order && (
					<pre className="overflow-auto rounded-md border bg-muted p-4 text-sm">
						{JSON.stringify(order, null, 2)}
					</pre>
				)}
			</div>
		</div>
	);
}
