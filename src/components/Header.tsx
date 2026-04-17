"use client";

import { ChevronDown, CreditCard, Plus, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function Header() {
	const { open } = useSidebar();

	return (
		<header
			className={`fixed flex h-14 shrink-0 items-center ${
				open
					? "md:w-[calc(100%-var(--sidebar-width))]"
					: "md:w-[calc(100%-var(--sidebar-width-icon))]"
			} z-10 w-full justify-between gap-2 border-border border-b bg-background px-2 transition-[width] ease-linear`}
		>
			<div className="flex items-center gap-2 px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
			</div>

			<div className="flex h-14 items-center gap-2 px-4">
				<AddButton />
			</div>
		</header>
	);
}

function AddButton() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild className="focus-visible:ring-0">
				<Button className="px-0" variant="outline">
					<div className="flex h-full items-center">
						<div className="flex items-center justify-center gap-2 px-3 py-2">
							<Plus className="h-4 w-4" />
							<span>Add</span>
						</div>
						<Separator orientation="vertical" />
						<div className="flex items-center justify-center px-3 py-2">
							<ChevronDown className="h-4 w-4" />
						</div>
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem>
					<Receipt className="mr-2 h-4 w-4" />
					Add Receipt
				</DropdownMenuItem>
				<DropdownMenuItem>
					<CreditCard className="mr-2 h-4 w-4" />
					Add Payment
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
