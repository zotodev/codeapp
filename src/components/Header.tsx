"use client";

import { useMatch, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export function Header() {
  const { open } = useSidebar();
  const router = useRouter();
  const orderMatch = useMatch({
    from: "/orders/$orderId/",
    shouldThrow: false,
  });
  const orderId = orderMatch?.params.orderId;

  return (
    <header
      className={`fixed flex h-14 shrink-0 items-center ${
        open
          ? "md:w-[calc(100%-var(--sidebar-width))]"
          : "md:w-[calc(100%-var(--sidebar-width-icon))]"
      } z-10 w-full justify-between gap-2 border-border border-b bg-background px-2 transition-[width] ease-linear`}
    >
      <div className="flex min-w-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator className="mr-2 h-4" orientation="vertical" />
        {orderId && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => router.history.back()}
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeftIcon />
            </Button>
            <span
              className="min-w-0 truncate font-mono text-sm font-medium"
              title={orderId}
            >
              {orderId}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
