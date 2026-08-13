import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCwIcon } from "lucide-react";

import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap_ordersService } from "@/generated/services/Zap_ordersService";

export const Route = createFileRoute("/polling")({
	component: PollingPage,
});

function PollingPage() {
	const { data, error, isLoading, isFetching, dataUpdatedAt } = useQuery({
		queryKey: ["orders", "status-counts"],
		queryFn: async () => {
			const result = await Zap_ordersService.getAll({
				select: ["statecode"],
				maxPageSize: 5000,
			});
			if (result.error) throw result.error;
			const rows = result.data ?? [];
			return {
				active: rows.filter((r) => r.statecode === 0).length,
				inactive: rows.filter((r) => r.statecode === 1).length,
			};
		},
		refetchInterval: 5000,
	});

	return (
		<div className="p-2">
			<PageHeader
				label="Polling"
				description="Active / inactive order counts. Refetches every 5s."
			>
				{isFetching && (
					<RefreshCwIcon className="size-4 animate-spin text-muted-foreground" />
				)}
			</PageHeader>

			{error && (
				<p className="mt-4 text-sm text-destructive">{error.message}</p>
			)}

			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Active</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-bold text-3xl">
							{isLoading ? "…" : (data?.active ?? 0)}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Inactive</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-bold text-3xl">
							{isLoading ? "…" : (data?.inactive ?? 0)}
						</p>
					</CardContent>
				</Card>
			</div>

			{dataUpdatedAt > 0 && (
				<p className="mt-4 text-muted-foreground text-xs">
					Last updated {new Date(dataUpdatedAt).toLocaleTimeString()}
				</p>
			)}
		</div>
	);
}
