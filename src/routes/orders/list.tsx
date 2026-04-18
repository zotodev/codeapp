import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon, RefreshCwIcon } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Zap_ordersService } from "@/generated/services/Zap_ordersService";
import { columns } from "./-components/columns";
import { DataTable } from "./-components/data-table";

export const Route = createFileRoute("/orders/list")({
	component: OrdersListPage,
});

const PAGE_SIZE = 10;

function OrdersListPage() {
	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isRefetching,
		refetch,
	} = useInfiniteQuery({
		queryKey: ["orders", "list"],
		queryFn: async ({ pageParam }) => {
			const result = await Zap_ordersService.getAll({
				select: [
					"zap_orderid",
					"zap_id",
					"zap_address",
					"createdon",
					"statecode",
				],
				orderBy: ["createdon desc"],
				maxPageSize: PAGE_SIZE,
				skipToken: pageParam,
			});
			if (result.error) {
				throw result.error;
			}
			return { data: result.data ?? [], skipToken: result.skipToken };
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.skipToken ?? undefined,
	});

	const orders = data?.pages.flatMap((page) => page.data) ?? [];

	return (
		<div className="p-2">
			<PageHeader label="Orders" description="Showing orders from Dataverse.">
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isRefetching || isLoading}
				>
					<RefreshCwIcon
						className={`mr-1 size-4${isRefetching ? " animate-spin" : ""}`}
					/>
					Refresh
				</Button>
				<Button asChild size="sm">
					<Link to="/orders/create">
						<PlusIcon className="mr-1 size-4" />
						New Order
					</Link>
				</Button>
			</PageHeader>

			{error && (
				<p className="mt-4 text-sm text-destructive">{error.message}</p>
			)}

			<div className="mt-6">
				<DataTable
					columns={columns}
					data={orders}
					isLoading={isLoading}
					isFetchingNextPage={isFetchingNextPage}
				/>
			</div>

			{hasNextPage && (
				<div className="mt-4 flex justify-center">
					<Button
						variant="outline"
						size="sm"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? "Loading…" : "Load More"}
					</Button>
				</div>
			)}
		</div>
	);
}
