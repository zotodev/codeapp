import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import PageHeader from "@/components/page-header";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Zap_GreetApiService } from "@/generated/services/Zap_GreetApiService";

export const Route = createFileRoute("/custom-api/")({
	component: CustomApiPage,
});

function CustomApiPage() {
	const formRef = useRef<HTMLFormElement>(null);
	const [nameError, setNameError] = useState<string | null>(null);

	const { mutate, isPending, data, error, isSuccess, reset } = useMutation({
		mutationFn: async (zap_name: string) => {
			const result = await Zap_GreetApiService.zap_GreetApi(zap_name);
			if (result.error) throw result.error;
			return result;
		},
	});

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setNameError(null);

		const form = e.currentTarget;
		const zap_name = String(new FormData(form).get("zap_name") ?? "").trim();

		if (!zap_name) {
			setNameError("Name is required.");
			return;
		}

		mutate(zap_name);
	}

	function handleReset() {
		reset();
		setNameError(null);
		formRef.current?.reset();
	}

	const isOk = data?.success === true;
	const responseBody = data?.data;

	return (
		<div className="flex flex-col">
			<PageHeader
				label="Custom API"
				description="Call the zap_GreetApi Dataverse custom API with a name and inspect the response."
			/>

			<div className="p-4 sm:p-6">
				<div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2 lg:items-start">
					<Card>
						<CardHeader>
							<CardTitle>Request</CardTitle>
							<CardDescription>
								Sends{" "}
								<code className="rounded bg-muted px-1 py-px font-mono text-xs">
									zap_name
								</code>{" "}
								to{" "}
								<code className="rounded bg-muted px-1 py-px font-mono text-xs">
									zap_GreetApi
								</code>
								.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<form
								ref={formRef}
								onSubmit={handleSubmit}
								className="space-y-5"
							>
								<div className="space-y-1.5">
									<Label htmlFor="zap_name">
										Name{" "}
										<span className="text-destructive" aria-hidden>
											*
										</span>
									</Label>
									<Input
										id="zap_name"
										name="zap_name"
										placeholder="Enter a name to greet"
										required
										disabled={isPending}
									/>
									{nameError ? (
										<p className="text-xs text-destructive">{nameError}</p>
									) : (
										<p className="text-xs text-muted-foreground">
											Required string parameter for the greet custom API.
										</p>
									)}
								</div>

								<Separator />

								<div className="flex flex-wrap gap-2">
									<Button type="submit" disabled={isPending} className="min-w-28">
										{isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Calling…
											</>
										) : (
											"Call Greet API"
										)}
									</Button>

									{(isSuccess || error) && !isPending && (
										<Button
											type="button"
											variant="outline"
											onClick={handleReset}
										>
											Clear & reset
										</Button>
									)}
								</div>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between gap-2">
								<CardTitle>Response</CardTitle>
								{data && (
									<Badge variant={isOk ? "default" : "destructive"}>
										{isOk ? "Success" : "Error"}
									</Badge>
								)}
							</div>
							<CardDescription>
								Raw payload returned from the custom API operation.
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							{!data && !error && !isPending && (
								<p className="text-sm text-muted-foreground">
									Enter a name and call the API to see the response here.
								</p>
							)}

							{isPending && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" />
									Calling custom API…
								</div>
							)}

							{error && (
								<Alert variant="destructive">
									<XCircle className="h-4 w-4" />
									<AlertTitle>Request failed</AlertTitle>
									<AlertDescription>{error.message}</AlertDescription>
								</Alert>
							)}

							{data && !isPending && (
								<>
									<Alert variant={isOk ? "default" : "destructive"}>
										{isOk ? (
											<CheckCircle2 className="h-4 w-4" />
										) : (
											<XCircle className="h-4 w-4" />
										)}
										<AlertTitle>
											{isOk ? "API call succeeded" : "API returned an error"}
										</AlertTitle>
									</Alert>

									{responseBody != null && (
										<div className="space-y-1.5">
											<Label className="text-xs text-muted-foreground">
												Response body
											</Label>
											<pre className="max-h-96 overflow-auto rounded-md border bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
												{JSON.stringify(responseBody, null, 2)}
											</pre>
										</div>
									)}

									{responseBody == null && (
										<p className="text-sm text-muted-foreground">
											No response body returned.
										</p>
									)}
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
