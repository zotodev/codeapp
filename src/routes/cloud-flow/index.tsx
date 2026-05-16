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
import { Switch } from "@/components/ui/switch";
import type { ManualTriggerInput } from "@/generated/models/GetAPISubmissionDataModel";
import { GetAPISubmissionDataService } from "@/generated/services/GetAPISubmissionDataService";

export const Route = createFileRoute("/cloud-flow/")({
	component: GetAPISubmissionPage,
});

function GetAPISubmissionPage() {
	const formRef = useRef<HTMLFormElement>(null);
	const [continueVal, setContinueVal] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const { mutate, isPending, data, error, isSuccess, reset } = useMutation({
		mutationFn: (payload: ManualTriggerInput) =>
			GetAPISubmissionDataService.Run(payload),
	});

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setFileError(null);

		const form = e.currentTarget;
		const data = new FormData(form);

		const fileInput = form.elements.namedItem("file") as HTMLInputElement;
		const file = fileInput?.files?.[0];

		if (!file) {
			setFileError("Please select a file.");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const base64 = (reader.result as string).split(",")[1] ?? "";
			mutate({
				text: String(data.get("text") ?? ""),
				number: Number(data.get("number") ?? 0),
				date: String(data.get("date") ?? ""),
				boolean: continueVal,
				email: String(data.get("email") ?? ""),
				file: {
					name: file.name,
					contentBytes: base64,
				},
			});
		};
		reader.readAsDataURL(file);
	}

	function handleReset() {
		reset();
		setFileError(null);
		setContinueVal(false);
		formRef.current?.reset();
	}

	const responseCode = data?.data?.response_code;
	const responseBody = data?.data?.response;
	const isOk = data?.success === true;

	return (
		<div className="flex flex-col">
			<PageHeader
				label="Get API Submission"
				description="Trigger the Power Automate cloud flow with typed inputs and inspect the response."
			/>

			<div className="p-4 sm:p-6">
				<div className="grid gap-6 lg:grid-cols-2 lg:items-start max-w-5xl mx-auto">
					{/* ── Input card ───────────────────────────────── */}
					<Card>
						<CardHeader>
							<CardTitle>Trigger inputs</CardTitle>
							<CardDescription>
								All fields map directly to{" "}
								<code className="rounded bg-muted px-1 py-px text-xs font-mono">
									ManualTriggerInput
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
								{/* Name */}
								<div className="space-y-1.5">
									<Label htmlFor="text">
										Name <Required />
									</Label>
									<Input
										id="text"
										name="text"
										placeholder="Enter a name"
										required
										disabled={isPending}
									/>
									<FieldHint>Mapped to text (string)</FieldHint>
								</div>

								{/* Age */}
								<div className="space-y-1.5">
									<Label htmlFor="number">
										Age <Required />
									</Label>
									<Input
										id="number"
										name="number"
										type="number"
										min={0}
										placeholder="0"
										required
										disabled={isPending}
									/>
									<FieldHint>Mapped to number (number)</FieldHint>
								</div>

								{/* Start Date */}
								<div className="space-y-1.5">
									<Label htmlFor="date">
										Start Date <Required />
									</Label>
									<Input
										id="date"
										name="date"
										type="date"
										required
										disabled={isPending}
									/>
									<FieldHint>Mapped to date (YYYY-MM-DD)</FieldHint>
								</div>

								{/* Email */}
								<div className="space-y-1.5">
									<Label htmlFor="email">
										Email <Required />
									</Label>
									<Input
										id="email"
										name="email"
										type="email"
										placeholder="you@example.com"
										required
										disabled={isPending}
									/>
									<FieldHint>Mapped to email (string)</FieldHint>
								</div>

								{/* File */}
								<div className="space-y-1.5">
									<Label htmlFor="file">
										Upload file <Required />
									</Label>
									<Input
										id="file"
										name="file"
										type="file"
										disabled={isPending}
										className="cursor-pointer"
										onChange={() => setFileError(null)}
									/>
									{fileError ? (
										<p className="text-xs text-destructive">{fileError}</p>
									) : (
										<FieldHint>
											Mapped to file (contentBytes as base64, name)
										</FieldHint>
									)}
								</div>

								{/* Do you want to continue */}
								<div className="space-y-1.5">
									<Label htmlFor="boolean">Do you want to continue?</Label>
									<div className="flex items-center gap-3 pt-0.5">
										<Switch
											id="boolean"
											checked={continueVal}
											onCheckedChange={setContinueVal}
											disabled={isPending}
										/>
										<span className="text-sm text-muted-foreground">
											{continueVal ? "Yes" : "No"}
										</span>
									</div>
									<FieldHint>Mapped to boolean</FieldHint>
								</div>

								<Separator />

								<div className="flex flex-wrap gap-2">
									<Button type="submit" disabled={isPending} className="min-w-28">
										{isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Running…
											</>
										) : (
											"Run flow"
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

					{/* ── Result card ──────────────────────────────── */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between gap-2">
								<CardTitle>Response</CardTitle>
								{data && (
									<Badge variant={isOk ? "default" : "destructive"}>
										{responseCode != null ? `HTTP ${responseCode}` : isOk ? "OK" : "Error"}
									</Badge>
								)}
							</div>
							<CardDescription>
								Output from{" "}
								<code className="rounded bg-muted px-1 py-px text-xs font-mono">
									ResponseActionOutput
								</code>
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							{/* Idle */}
							{!data && !error && !isPending && (
								<p className="text-sm text-muted-foreground">
									Fill in the form and run the flow to see the response here.
								</p>
							)}

							{/* Loading */}
							{isPending && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" />
									Waiting for Power Automate…
								</div>
							)}

							{/* Mutation (network) error */}
							{error && (
								<Alert variant="destructive">
									<XCircle className="h-4 w-4" />
									<AlertTitle>Request failed</AlertTitle>
									<AlertDescription>{error.message}</AlertDescription>
								</Alert>
							)}

							{/* Flow returned */}
							{data && !isPending && (
								<>
									<Alert variant={isOk ? "default" : "destructive"}>
										{isOk ? (
											<CheckCircle2 className="h-4 w-4" />
										) : (
											<XCircle className="h-4 w-4" />
										)}
										<AlertTitle>{isOk ? "Flow succeeded" : "Flow returned an error"}</AlertTitle>
										{responseCode != null && (
											<AlertDescription>
												Response code: <strong>{responseCode}</strong>
											</AlertDescription>
										)}
									</Alert>

									{responseBody != null && (
										<div className="space-y-1.5">
											<Label className="text-xs text-muted-foreground">
												Response body
											</Label>
											<pre className="max-h-96 overflow-auto rounded-md border bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all">
												{(() => {
													try {
														return JSON.stringify(
															JSON.parse(responseBody),
															null,
															2,
														);
													} catch {
														return responseBody;
													}
												})()}
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

function Required() {
	return (
		<span className="text-destructive" aria-hidden>
			*
		</span>
	);
}

function FieldHint({ children }: { children: React.ReactNode }) {
	return <p className="text-xs text-muted-foreground">{children}</p>;
}
