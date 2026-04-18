import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitAndWaitForResponse } from "@/services/cloudflow-calls-service";

export function useCloudFlow() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: submitAndWaitForResponse,
		onSuccess() {
			queryClient.invalidateQueries({ queryKey: ["recentCalls"] });
		},
	});
}
