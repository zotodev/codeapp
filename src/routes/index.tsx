import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, PlusIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Zap_cloudflowrunsService } from "@/generated/services/Zap_cloudflowrunsService";

export const Route = createFileRoute("/")({
	component: CloudFlowRunsPage,
});

const QUERY_KEY = ["cloudflowruns"];

function CloudFlowRunsPage() {
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [zapId, setZapId] = useState("");
	const [zapRequest, setZapRequest] = useState("");
	const [ttlInSeconds, setTtlInSeconds] = useState("");

	const {
		data: rows = [],
		error,
		isLoading,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: QUERY_KEY,
		queryFn: async () => {
			const result = await Zap_cloudflowrunsService.getAll({
				orderBy: ["createdon desc"],
				select: [
					"zap_cloudflowrunid",
					"zap_id",
					"zap_request",
					"ttlinseconds",
					"createdon",
				],
			});
			if (result.error) throw result.error;
			return result.data ?? [];
		},
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			const ttl = ttlInSeconds.trim()
				? Number.parseInt(ttlInSeconds, 10)
				: undefined;
			if (ttlInSeconds.trim() && Number.isNaN(ttl)) {
				throw new Error("TTL must be a valid number of seconds.");
			}

			const payload = {
				...(zapId ? { zap_id: zapId } : {}),
				...(zapRequest ? { zap_request: zapRequest } : {}),
				...(ttl != null ? { ttlinseconds: ttl } : {}),
			} as Parameters<typeof Zap_cloudflowrunsService.create>[0];

			const result = await Zap_cloudflowrunsService.create(payload);
			if (result.error) throw result.error;
			return result.data;
		},
		onSuccess: (created) => {
			toast.success("Cloud flow run created", {
				description: created?.zap_id ?? created?.zap_cloudflowrunid,
			});
			setZapId("");
			setZapRequest("");
			setTtlInSeconds("");
			setDialogOpen(false);
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
		onError: (err) => {
			toast.error("Failed to create record", {
				description: err instanceof Error ? err.message : "Unknown error",
			});
		},
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	return (
		<div className="p-2">
			<PageHeader
				label="Cloud Flow Runs"
				description="Records from the zap_cloudflowruns Dataverse table."
			>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isFetching || isLoading}
				>
					<RefreshCwIcon
						className={`mr-1 size-4${isFetching ? " animate-spin" : ""}`}
					/>
					Refresh
				</Button>
				<Button size="sm" onClick={() => setDialogOpen(true)}>
					<PlusIcon className="mr-1 size-4" />
					New Record
				</Button>
			</PageHeader>

			{error && (
				<p className="mt-4 px-4 text-sm text-destructive">{error.message}</p>
			)}

			<div className="mt-6 px-4">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>ID</TableHead>
								<TableHead>Request</TableHead>
								<TableHead>TTL (s)</TableHead>
								<TableHead>Created</TableHead>
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
										No cloud flow runs found.
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => (
									<TableRow key={row.zap_cloudflowrunid}>
										<TableCell className="font-mono text-xs">
											{row.zap_id ?? row.zap_cloudflowrunid}
										</TableCell>
										<TableCell className="max-w-md truncate font-mono text-xs">
											{row.zap_request ?? "—"}
										</TableCell>
										<TableCell className="whitespace-nowrap tabular-nums">
											{row.ttlinseconds ?? "—"}
										</TableCell>
										<TableCell className="whitespace-nowrap">
											{row.createdon
												? new Date(row.createdon).toLocaleString()
												: "—"}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Cloud Flow Run</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleCreate} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="zap_id">ID (optional)</Label>
							<Input
								id="zap_id"
								value={zapId}
								onChange={(e) => setZapId(e.target.value)}
								placeholder="e.g. RUN-001"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="zap_request">Request (optional)</Label>
							<Textarea
								id="zap_request"
								value={zapRequest}
								onChange={(e) => setZapRequest(e.target.value)}
								placeholder='e.g. {"action":"start"}'
								rows={4}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="ttlinseconds">TTL in seconds (optional)</Label>
							<Input
								id="ttlinseconds"
								type="number"
								min={0}
								value={ttlInSeconds}
								onChange={(e) => setTtlInSeconds(e.target.value)}
								placeholder="e.g. 3600"
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
								disabled={createMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={createMutation.isPending}>
								{createMutation.isPending ? (
									<>
										<Loader2 className="mr-1 size-4 animate-spin" />
										Creating…
									</>
								) : (
									"Create"
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
