import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Zap_cloudflowcallsService } from "@/generated/services/Zap_cloudflowcallsService";

export function RecentCalls() {
	const queryClient = useQueryClient();
	const {
		data: rows = [],
		isLoading,
		isFetching,
		error,
	} = useQuery({
		queryKey: ["recentCalls"],
		queryFn: async () => {
			const result = await Zap_cloudflowcallsService.getAll({
				top: 5,
				orderBy: ["createdon desc"],
				select: [
					"zap_cloudflowcallid",
					"zap_request",
					"zap_response",
					"zap_responsecode",
					"createdon",
				],
			});
			if (result.error) throw result.error;
			return result.data ?? [];
		},
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm">Recent Calls</CardTitle>
				<Button
					size="sm"
					variant="outline"
					disabled={isFetching}
					onClick={() =>
						queryClient.invalidateQueries({ queryKey: ["recentCalls"] })
					}
				>
					{isFetching ? (
						<>
							<Spinner className="mr-1.5 h-3 w-3" />
							Refreshing…
						</>
					) : (
						"Refresh"
					)}
				</Button>
			</CardHeader>
			<CardContent>
				{error && <p className="text-sm text-destructive">{error.message}</p>}

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Created</TableHead>
								<TableHead>Request</TableHead>
								<TableHead>Code</TableHead>
								<TableHead>Response</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								["r0", "r1", "r2"].map((k) => (
									<TableRow key={k}>
										{["c0", "c1", "c2", "c3"].map((c) => (
											<TableCell key={c}>
												<Skeleton className="h-4 w-full" />
											</TableCell>
										))}
									</TableRow>
								))
							) : rows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="py-6 text-center text-muted-foreground"
									>
										No calls found.
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => (
									<TableRow key={row.zap_cloudflowcallid}>
										<TableCell className="whitespace-nowrap">
											{row.createdon
												? new Date(row.createdon).toLocaleString()
												: "—"}
										</TableCell>
										<TableCell className="max-w-[200px] truncate font-mono text-xs">
											{row.zap_request ?? "—"}
										</TableCell>
										<TableCell>
											{row.zap_responsecode != null ? (
												<Badge
													variant={
														row.zap_responsecode >= 200 &&
														row.zap_responsecode < 300
															? "default"
															: "destructive"
													}
												>
													{row.zap_responsecode}
												</Badge>
											) : (
												<Badge variant="outline">Pending</Badge>
											)}
										</TableCell>
										<TableCell className="max-w-[250px] truncate font-mono text-xs">
											{row.zap_response ?? "—"}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
