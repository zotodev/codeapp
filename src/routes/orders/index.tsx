import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, PlusIcon, RefreshCwIcon } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import * as React from "react";

import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTable } from "@/components/data-table/data-table";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Zap_ordersService } from "@/generated/services/Zap_ordersService";
import { useDataTable } from "@/hooks/use-data-table";
import { buildDataverseQuery } from "@/lib/dataverse-odata";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";
import { advancedColumns } from "./-components/advanced-columns";

export const Route = createFileRoute("/orders/")({
	component: OrdersAdvancedPage,
});

const PAGE_SIZE = 25;

const COLUMN_IDS = new Set(
	advancedColumns.map((c) => c.id).filter(Boolean) as string[],
);

function OrdersAdvancedPage() {
	const [filters] = useQueryState(
		"filters",
		getFiltersStateParser(COLUMN_IDS).withDefault([]),
	);

	const [sorting] = useQueryState(
		"sort",
		getSortingStateParser(COLUMN_IDS).withDefault([]),
	);

	const [joinOperator] = useQueryState(
		"joinOperator",
		parseAsStringEnum(["and", "or"] as const).withDefault("and"),
	);

	const { filter, orderBy } = buildDataverseQuery({
		filters,
		joinOperator,
		sorting,
	});

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
		queryKey: ["orders", "advanced", filter, orderBy?.join(",")],
		queryFn: async ({ pageParam }) => {
			const result = await Zap_ordersService.getAll({
				select: [
					"zap_orderid",
					"zap_id",
					"zap_address",
					"createdon",
					"statecode",
				],
				filter,
				orderBy: orderBy ?? ["createdon desc"],
				maxPageSize: PAGE_SIZE,
				skipToken: pageParam,
			});
			if (result.error) throw result.error;
			return {
				data: result.data ?? [],
				skipToken: result.skipToken,
			};
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.skipToken ?? undefined,
	});

	const rows = React.useMemo(
		() => data?.pages.flatMap((page) => page.data) ?? [],
		[data],
	);

	const { table } = useDataTable({
		data: rows,
		columns: advancedColumns,
		pageCount: -1,
		enableAdvancedFilter: true,
	});

	const loadMore = (
		<div className="flex flex-col items-center gap-2 py-2">
			{hasNextPage && (
				<Button
					variant="outline"
					size="sm"
					onClick={() => fetchNextPage()}
					disabled={isFetchingNextPage}
				>
					{isFetchingNextPage ? (
						<>
							<Loader2 className="mr-1 size-4 animate-spin" />
							Loading…
						</>
					) : (
						"Load More"
					)}
				</Button>
			)}
			{!hasNextPage && rows.length > 0 && (
				<p className="text-muted-foreground text-xs">All records loaded.</p>
			)}
		</div>
	);

	return (
		<div className="p-2">
			<PageHeader label="Orders" description="Advanced filter and sort.">
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
				<DataTable table={table} pagination={loadMore}>
					<DataTableAdvancedToolbar table={table}>
						<DataTableFilterList table={table} />
						<DataTableSortList table={table} />
					</DataTableAdvancedToolbar>
				</DataTable>
			</div>
		</div>
	);
}
