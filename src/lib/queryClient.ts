import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1000 * 60 * 5,
			staleTime: 1000 * 60,
			retry: 3,
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
		},
		mutations: {
			retry: 0,
		},
	},
});
