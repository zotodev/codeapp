import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useFlowBroker } from "@/hooks/use-flow-broker";
import { RecentCalls } from "./-components/recent-calls";

const DEFAULT_PAYLOAD = JSON.stringify({ action: "ping", data: {} }, null, 2);

export const Route = createFileRoute("/api/")({
	component: FlowBrokerTestPage,
});

function FlowBrokerTestPage() {
	const queryClient = useQueryClient();
	const [rawPayload, setRawPayload] = useState(DEFAULT_PAYLOAD);
	const [parseError, setParseError] = useState<string | null>(null);

	const {
		submit,
		isSubmitting,
		isPolling,
		timedOut,
		responseCode,
		response,
		error,
		reset,
	} = useFlowBroker();

	const busy = isSubmitting || isPolling;
	const isDone = responseCode !== null;

	// Refresh the recent calls table as soon as the flow responds
	useEffect(() => {
		if (isDone) {
			queryClient.invalidateQueries({ queryKey: ["recentCalls"] });
		}
	}, [isDone, queryClient]);

	function handleSubmit() {
		setParseError(null);
		let parsed: unknown;
		try {
			parsed = JSON.parse(rawPayload);
		} catch {
			setParseError("Invalid JSON — fix the payload before submitting.");
			return;
		}
		submit(parsed);
	}

	function handleReset() {
		reset();
		queryClient.invalidateQueries({ queryKey: ["recentCalls"] });
	}

	return (
		<div className="px-2 space-y-4">
			<PageHeader
				label="Flow Broker Test"
				description="Writes a row to Cloud Flow Calls, waits for Power Automate to respond, then displays the result."
			/>

			<div className="flex gap-4 items-start">
				{/* ── Left column — 30% ───────────────────────────────── */}
				<div className="w-[30%] shrink-0 space-y-4">
					{/* Request */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">Request Payload</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="space-y-1.5">
								<Label htmlFor="payload" className="text-xs">
									JSON (sent as Request)
								</Label>
								<Textarea
									id="payload"
									className="font-mono text-xs h-32 resize-none"
									value={rawPayload}
									onChange={(e) => setRawPayload(e.target.value)}
									disabled={busy}
								/>
								{parseError && (
									<p className="text-xs text-destructive">{parseError}</p>
								)}
							</div>

							<div className="flex gap-2">
								<Button size="sm" onClick={handleSubmit} disabled={busy}>
									{isSubmitting ? (
										<>
											<Spinner className="mr-1.5 h-3 w-3" />
											Creating…
										</>
									) : isPolling ? (
										<>
											<Spinner className="mr-1.5 h-3 w-3" />
											Polling…
										</>
									) : (
										"Trigger Flow"
									)}
								</Button>

								{(isDone || timedOut || error) && (
									<Button size="sm" variant="outline" onClick={handleReset}>
										Reset
									</Button>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Status / Response */}
					{(busy || isDone || timedOut || error) && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">
									{error || timedOut
										? "Error"
										: isDone
											? `Response — ${responseCode}`
											: "Status"}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{isPolling && !isDone && (
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Spinner className="h-3 w-3" />
										Polling every 2s…
									</div>
								)}

								{(error || timedOut) && (
									<p className="text-xs text-destructive">
										{error?.message ??
											"Flow did not respond within 10 seconds."}
									</p>
								)}

								{isDone && response && (
									<div className="space-y-1">
										<Label className="text-xs">Response</Label>
										<pre className="rounded-md bg-muted p-2 text-xs font-mono overflow-auto whitespace-pre-wrap break-all max-h-48">
											{(() => {
												try {
													return JSON.stringify(JSON.parse(response), null, 2);
												} catch {
													return response;
												}
											})()}
										</pre>
									</div>
								)}

								{isDone && !response && (
									<p className="text-xs text-muted-foreground">
										Responded with code {responseCode} but no body.
									</p>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* ── Right column — 70% ──────────────────────────────── */}
				<div className="flex-1 min-w-0">
					<RecentCalls />
				</div>
			</div>
		</div>
	);
}
