import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AddSaleForm({
	tabId,
}: { tabId: string } & Record<string, unknown>) {
	const [submitted, setSubmitted] = useState(false);

	return (
		<div className="p-6 space-y-6 w-full">
			<div className="flex items-center gap-2">
				<h1 className="text-lg font-semibold">New Sale</h1>
				<Badge variant="outline" className="font-mono text-xs">
					{tabId.slice(0, 8)}
				</Badge>
			</div>

			<Separator />

			<form
				className="space-y-4 w-full"
				onSubmit={(e) => {
					e.preventDefault();
					setSubmitted(true);
				}}
			>
				<div className="space-y-2">
					<Label htmlFor={`${tabId}-customer`}>Customer Name</Label>
					<Input id={`${tabId}-customer`} placeholder="Acme Corp" />
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${tabId}-amount`}>Amount</Label>
					<Input
						id={`${tabId}-amount`}
						type="number"
						placeholder="0.00"
						min={0}
						step={0.01}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={`${tabId}-status`}>Status</Label>
					<Select>
						<SelectTrigger id={`${tabId}-status`} className="w-full">
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="confirmed">Confirmed</SelectItem>
							<SelectItem value="closed">Closed</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2 pt-2">
					<Button type="submit">Save Sale</Button>
					{submitted && (
						<span className="text-sm text-muted-foreground">✓ Saved</span>
					)}
				</div>
			</form>
		</div>
	);
}
