"use client";

import { ClipboardListIcon, WorkflowIcon } from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Orders",
			url: "#",
			icon: <ClipboardListIcon />,
			isActive: true,
			items: [
				{
					title: "Browse",
					url: "/orders",
				},
				{
					title: "List",
					url: "/orders/list",
				},
				{
					title: "Create",
					url: "/orders/create",
				},
				{
					title: "API",
					url: "/api",
				},
			],
		},
		{
			title: "Cloud flows",
			url: "#",
			icon: <WorkflowIcon />,
			items: [
				{
					title: "Get API submission",
					url: "/cloud-flow",
				},
			],
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader />
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
