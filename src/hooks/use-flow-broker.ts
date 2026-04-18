import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Zap_cloudflowcallsService } from "@/generated/services/Zap_cloudflowcallsService";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 10_000;

export function useFlowBroker() {
	const queryClient = useQueryClient();
	const [rowId, setRowId] = useState<string | null>(null);
	const [timedOut, setTimedOut] = useState(false);

	const mutation = useMutation({
		mutationFn: async (requestPayload: unknown) => {
			const record = {
				zap_request: JSON.stringify(requestPayload),
			} as Parameters<typeof Zap_cloudflowcallsService.create>[0];

			const result = await Zap_cloudflowcallsService.create(record);
			if (result.error) throw result.error;
			if (!result.data?.zap_cloudflowcallid) {
				throw new Error("Dataverse did not return a row ID.");
			}
			return result.data.zap_cloudflowcallid;
		},
		onSuccess: (id) => {
			setTimedOut(false);
			setRowId(id);
			setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
		},
	});

	const pollQuery = useQuery({
		queryKey: ["flowBroker", rowId],
		queryFn: async () => {
			if (!rowId) throw new Error("No row ID");
			const result = await Zap_cloudflowcallsService.get(rowId, {
				select: ["zap_response", "zap_responsecode"],
			});
			if (result.error) throw result.error;
			return result.data ?? null;
		},
		enabled: !!rowId && !timedOut,
		refetchInterval: (query) => {
			if (query.state.data?.zap_responsecode != null) return false;
			return POLL_INTERVAL_MS;
		},
	});

	const hasResponse = pollQuery.data?.zap_responsecode != null;

	function reset() {
		if (rowId) {
			queryClient.removeQueries({ queryKey: ["flowBroker", rowId] });
		}
		setRowId(null);
		setTimedOut(false);
		mutation.reset();
	}

	return {
		submit: (payload: unknown) => mutation.mutate(payload),
		isSubmitting: mutation.isPending,
		isPolling: !!rowId && !hasResponse && !timedOut,
		timedOut: timedOut && !hasResponse,
		responseCode: pollQuery.data?.zap_responsecode ?? null,
		response: pollQuery.data?.zap_response ?? null,
		error:
			mutation.error ??
			(timedOut && !hasResponse
				? new Error("Flow did not respond within 10 seconds.")
				: null) ??
			pollQuery.error ??
			null,
		reset,
	};
}
