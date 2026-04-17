import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap_ordersService } from "@/generated/services/Zap_ordersService";

export const Route = createFileRoute("/orders/create")({
	component: CreateOrderPage,
});

interface OrderFormData {
	zap_id: string;
	zap_address: string;
}

function CreateOrderPage() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState<OrderFormData>({
		zap_id: "",
		zap_address: "",
	});
	const [submitting, setSubmitting] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		// ownerid/owneridtype/statecode are system-managed; cast to bypass TS requirement
		const payload = {
			zap_address: formData.zap_address,
			...(formData.zap_id ? { zap_id: formData.zap_id } : {}),
		} as Parameters<typeof Zap_ordersService.create>[0];
		const result = await Zap_ordersService.create(payload);

		setSubmitting(false);

		if (result.error) {
			toast.error("Failed to create order", {
				description: result.error.message,
			});
			return;
		}

		const created = result.data;
		toast.success("Order created successfully", {
			description: [
				created?.zap_orderid && `Order ID: ${created.zap_orderid}`,
				created?.zap_id && `Custom ID: ${created.zap_id}`,
				`Address: ${created?.zap_address ?? formData.zap_address}`,
				created?.createdon &&
					`Created: ${new Date(created.createdon).toLocaleString()}`,
			]
				.filter(Boolean)
				.join("\n"),
			duration: 4000,
		});

		if (created?.zap_orderid) {
			await navigate({
				to: "/orders/$orderId",
				params: { orderId: created.zap_orderid },
			});
		} else {
			setFormData({ zap_id: "", zap_address: "" });
		}
	};

	return (
		<div className="p-6 max-w-lg mx-auto">
			<PageHeader
				label="Create Order"
				description="Fill in the details below to create a new order in Dataverse."
			/>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>New Order</CardTitle>
				</CardHeader>

				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="zap_id">Order ID (optional)</Label>
							<Input
								id="zap_id"
								name="zap_id"
								value={formData.zap_id}
								onChange={handleChange}
								placeholder="e.g. ORD-001"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="zap_address">
								Address <span className="text-destructive">*</span>
							</Label>
							<Input
								id="zap_address"
								name="zap_address"
								value={formData.zap_address}
								onChange={handleChange}
								placeholder="e.g. 123 Main St, City, Country"
								required
							/>
						</div>
					</CardContent>

					<CardFooter>
						<Button type="submit" disabled={submitting} className="w-full">
							{submitting ? "Creating..." : "Create Order"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
