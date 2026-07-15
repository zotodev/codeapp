import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import type { Zap_orders } from "@/generated/models/Zap_ordersModel";

type Col = Extract<keyof Zap_orders, string>;

export const advancedColumns: ColumnDef<Zap_orders, unknown>[] = [
  {
    id: "zap_orderid" satisfies Col,
    accessorKey: "zap_orderid",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Order ID" />
    ),
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{getValue<string>()}</span>
    ),
    enableColumnFilter: false,
    enableSorting: false,
  },
  {
    id: "zap_id" satisfies Col,
    accessorKey: "zap_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Custom ID" />
    ),
    cell: ({ getValue }) => getValue<string>() ?? "—",
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      label: "Custom ID",
      variant: "text",
      placeholder: "Search custom ID…",
    },
  },
  {
    id: "zap_address" satisfies Col,
    accessorKey: "zap_address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Address" />
    ),
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      label: "Address",
      variant: "text",
      placeholder: "Search address…",
    },
  },
  {
    id: "statecode" satisfies Col,
    accessorKey: "statecode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ getValue }) => {
      const active = getValue<number>() === 0;
      return (
        <span
          className={
            active
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground"
          }
        >
          {active ? "Active" : "Inactive"}
        </span>
      );
    },
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Active", value: "0" },
        { label: "Inactive", value: "1" },
      ],
    },
  },
  {
    id: "createdon" satisfies Col,
    accessorKey: "createdon",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Created On" />
    ),
    cell: ({ getValue }) => {
      const val = getValue<string | undefined>();
      return val ? new Date(val).toLocaleDateString() : "—";
    },
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      label: "Created On",
      variant: "date",
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => (
      <Button asChild aria-label="Open order" size="icon" variant="ghost">
        <Link
          to="/orders/$orderId"
          params={{ orderId: row.original.zap_orderid }}
        >
          <EyeIcon />
        </Link>
      </Button>
    ),
  },
];
