import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCloudFlow } from "@/hooks/use-cloud-flow";
import { RecentCalls } from "./-components/recent-calls";

const DEFAULT_PAYLOAD = JSON.stringify({ action: "ping", data: {} }, null, 2);

export const Route = createFileRoute("/api/")({
	component: FlowBrokerTestPage,
});

function FlowBrokerTestPage() {
	const [rawPayload, setRawPayload] = useState(DEFAULT_PAYLOAD);
	const [parseError, setParseError] = useState<string | null>(null);

	const { mutate, isPending, data, error, reset } = useCloudFlow();

	const isDone = data?.zap_responsecode != null;

	function handleSubmit() {
		setParseError(null);
		let parsed: unknown;
		try {
			parsed = JSON.parse(rawPayload);
		} catch {
			setParseError("Invalid JSON — fix the payload before submitting.");
			return;
		}
		mutate(parsed);
	}

	const response = data?.zap_response ?? null;
	const responseCode = data?.zap_responsecode ?? null;

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
									disabled={isPending}
								/>
								{parseError && (
									<p className="text-xs text-destructive">{parseError}</p>
								)}
							</div>

							<div className="flex gap-2">
								<Button size="sm" onClick={handleSubmit} disabled={isPending}>
									{isPending ? (
										<>
											<Spinner className="mr-1.5 h-3 w-3" />
											Submitting…
										</>
									) : (
										"Trigger Flow"
									)}
								</Button>

								{(isDone || error) && (
									<Button size="sm" variant="outline" onClick={reset}>
										Reset
									</Button>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Status / Response */}
					{(isPending || isDone || error) && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm">
									{error
										? "Error"
										: isDone
											? `Response — ${responseCode}`
											: "Status"}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{isPending && (
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<Spinner className="h-3 w-3" />
										Waiting for response…
									</div>
								)}

								{error && (
									<p className="text-xs text-destructive">{error.message}</p>
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
