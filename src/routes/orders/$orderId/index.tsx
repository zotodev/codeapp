import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { AlertCircleIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap_ordersstatecode,
  Zap_ordersstatuscode,
  Zap_orderszap_category,
  Zap_orderszap_subcategory,
  type Zap_orders,
  type Zap_ordersBase,
} from "@/generated/models/Zap_ordersModel";
import { Zap_ordersService } from "@/generated/services/Zap_ordersService";

export const Route = createFileRoute("/orders/$orderId/")({
  component: OrderDetailPage,
});

const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emptySelectValue = "none";

interface OrderFormData {
  zap_id: string;
  zap_address: string;
  zap_category?: keyof typeof Zap_orderszap_category;
  zap_subcategory?: keyof typeof Zap_orderszap_subcategory;
  statecode: keyof typeof Zap_ordersstatecode;
  statuscode?: keyof typeof Zap_ordersstatuscode;
}

interface DetailItem {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

function toFormData(order: Zap_orders): OrderFormData {
  return {
    zap_id: order.zap_id ?? "",
    zap_address: order.zap_address ?? "",
    zap_category: order.zap_category,
    zap_subcategory: order.zap_subcategory,
    statecode: order.statecode,
    statuscode: order.statuscode,
  };
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return <time dateTime={value}>{date.toLocaleString()}</time>;
}

function displayValue(value: ReactNode) {
  return value === undefined || value === null || value === "" ? "—" : value;
}

function DetailSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DetailItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="min-w-0 space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">
                {item.label}
              </dt>
              <dd
                className={`break-words text-sm ${item.mono ? "font-mono" : ""}`}
                title={typeof item.value === "string" ? item.value : undefined}
              >
                {displayValue(item.value)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-label="Loading order">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-52 w-full" />
    </div>
  );
}

function OrderDetailPage() {
  const { orderId } = useParams({ from: "/orders/$orderId/" });
  const queryClient = useQueryClient();
  const validOrderId = guidPattern.test(orderId);
  const queryKey = ["orders", "detail", orderId] as const;
  const [formChanges, setFormChanges] = useState<Partial<OrderFormData>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey,
    enabled: validOrderId,
    queryFn: async () => {
      const result = await Zap_ordersService.get(orderId);
      if (result.error) throw new Error(result.error.message);
      if (!result.data) throw new Error(`Order "${orderId}" was not found.`);
      return result.data;
    },
  });
  const order = orderQuery.data;
  const formData = order ? { ...toFormData(order), ...formChanges } : null;

  const updateOrder = useMutation({
    mutationFn: async (
      changedFields: Partial<Omit<Zap_ordersBase, "zap_orderid">>,
    ) => {
      const result = await Zap_ordersService.update(orderId, changedFields);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (updatedOrder, changedFields) => {
      const nextOrder =
        updatedOrder ??
        (order ? ({ ...order, ...changedFields } as Zap_orders) : undefined);
      if (nextOrder) queryClient.setQueryData(queryKey, nextOrder);
      queryClient.invalidateQueries({ queryKey: ["orders", "advanced"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
      setFormChanges({});
      setSaveError(null);
      toast.success("Order updated");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to update the order.";
      setSaveError(message);
      toast.error("Failed to update order", { description: message });
    },
  });

  const isDirty = Boolean(
    order &&
    formData &&
    (formData.zap_id !== (order.zap_id ?? "") ||
      formData.zap_address !== (order.zap_address ?? "") ||
      formData.zap_category !== order.zap_category ||
      formData.zap_subcategory !== order.zap_subcategory ||
      formData.statecode !== order.statecode ||
      formData.statuscode !== order.statuscode),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order || !formData) return;

    const address = formData.zap_address.trim();
    if (!address) {
      setSaveError("Address is required.");
      return;
    }

    const changedFields: Partial<Omit<Zap_ordersBase, "zap_orderid">> = {};
    if (formData.zap_id !== (order.zap_id ?? "")) {
      changedFields.zap_id = formData.zap_id.trim() || undefined;
    }
    if (address !== order.zap_address) changedFields.zap_address = address;
    if (formData.zap_category !== order.zap_category) {
      changedFields.zap_category = formData.zap_category;
    }
    if (formData.zap_subcategory !== order.zap_subcategory) {
      changedFields.zap_subcategory = formData.zap_subcategory;
    }
    if (formData.statecode !== order.statecode) {
      changedFields.statecode = formData.statecode;
    }
    if (formData.statuscode !== order.statuscode) {
      changedFields.statuscode = formData.statuscode;
    }

    setSaveError(null);
    updateOrder.mutate(changedFields);
  };

  if (!validOrderId) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Invalid order ID</AlertTitle>
          <AlertDescription>
            The route must contain a valid Dataverse GUID. Received “{orderId}”.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <LoadingState />
      </main>
    );
  }

  if (orderQuery.error || !order || !formData) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Unable to load order</AlertTitle>
          <AlertDescription>
            {orderQuery.error?.message ?? "The order could not be found."}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const identityItems: DetailItem[] = [
    { label: "Dataverse order ID", value: order.zap_orderid, mono: true },
    { label: "Display ID", value: order.zap_id },
    { label: "Category label", value: order.zap_categoryname },
    { label: "Subcategory label", value: order.zap_subcategoryname },
    { label: "State label", value: order.statecodename },
    { label: "Status label", value: order.statuscodename },
    { label: "Version", value: order.versionnumber },
  ];
  const ownershipItems: DetailItem[] = [
    { label: "Owner ID", value: order.ownerid, mono: true },
    { label: "Owner type", value: order.owneridtype },
    { label: "Owner name", value: order.owneridname },
    { label: "Owner phonetic name", value: order.owneridyominame },
    { label: "Business unit", value: order.owningbusinessunitname },
    {
      label: "Business unit ID",
      value: order._owningbusinessunit_value,
      mono: true,
    },
    { label: "Owning team ID", value: order._owningteam_value, mono: true },
    { label: "Owning user ID", value: order._owninguser_value, mono: true },
    {
      label: "Business unit lookup",
      value: order.owningbusinessunit ? "Linked record" : undefined,
    },
    {
      label: "Team lookup",
      value: order.owningteam ? "Linked record" : undefined,
    },
    {
      label: "User lookup",
      value: order.owninguser ? "Linked record" : undefined,
    },
  ];
  const auditItems: DetailItem[] = [
    { label: "Created on", value: formatDate(order.createdon) },
    { label: "Created by", value: order.createdbyname },
    { label: "Created by phonetic name", value: order.createdbyyominame },
    { label: "Created by ID", value: order._createdby_value, mono: true },
    {
      label: "Created by lookup",
      value: order.createdby ? "Linked record" : undefined,
    },
    { label: "Created on behalf by", value: order.createdonbehalfbyname },
    {
      label: "Created on behalf phonetic name",
      value: order.createdonbehalfbyyominame,
    },
    {
      label: "Created on behalf ID",
      value: order._createdonbehalfby_value,
      mono: true,
    },
    {
      label: "Created on behalf lookup",
      value: order.createdonbehalfby ? "Linked record" : undefined,
    },
    { label: "Modified on", value: formatDate(order.modifiedon) },
    { label: "Modified by", value: order.modifiedbyname },
    { label: "Modified by phonetic name", value: order.modifiedbyyominame },
    { label: "Modified by ID", value: order._modifiedby_value, mono: true },
    {
      label: "Modified by lookup",
      value: order.modifiedby ? "Linked record" : undefined,
    },
    { label: "Modified on behalf by", value: order.modifiedonbehalfbyname },
    {
      label: "Modified on behalf phonetic name",
      value: order.modifiedonbehalfbyyominame,
    },
    {
      label: "Modified on behalf ID",
      value: order._modifiedonbehalfby_value,
      mono: true,
    },
    {
      label: "Modified on behalf lookup",
      value: order.modifiedonbehalfby ? "Linked record" : undefined,
    },
  ];
  const systemItems: DetailItem[] = [
    { label: "Import sequence", value: order.importsequencenumber },
    {
      label: "Overridden created on",
      value: formatDate(order.overriddencreatedon),
    },
    { label: "Time zone rule version", value: order.timezoneruleversionnumber },
    {
      label: "UTC conversion time zone",
      value: order.utcconversiontimezonecode,
    },
    { label: "Attachment name", value: order.zap_attachment_name },
    { label: "Attachment value", value: order.zap_attachment, mono: true },
    { label: "File name", value: order.zap_file_name },
    { label: "File value", value: order.zap_file, mono: true },
  ];

  return (
    <main className="w-full">
      <PageHeader
        label={order.zap_id || order.zap_orderid}
        description="Update business information and review the Dataverse record."
        showBackButton
        className="sticky top-0 z-10 bg-background"
      >
        <Badge variant={order.statecode === 0 ? "secondary" : "outline"}>
          {order.statecodename ?? Zap_ordersstatecode[order.statecode]}
        </Badge>
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty || updateOrder.isPending}
          onClick={() => {
            setFormChanges({});
            setSaveError(null);
          }}
        >
          Reset
        </Button>
        <Button
          type="submit"
          form="order-form"
          disabled={!isDirty || updateOrder.isPending}
        >
          {updateOrder.isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {updateOrder.isPending ? "Saving" : "Save changes"}
        </Button>
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <form id="order-form" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Business information</CardTitle>
            <CardDescription>
              Fields used to identify and process this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zap_id">Display ID</Label>
              <Input
                id="zap_id"
                value={formData.zap_id}
                maxLength={850}
                placeholder="ORD-001"
                disabled={updateOrder.isPending}
                onChange={(event) =>
                  setFormChanges((current) => ({
                    ...current,
                    zap_id: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="zap_address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="zap_address"
                value={formData.zap_address}
                maxLength={100}
                required
                aria-invalid={Boolean(
                  saveError && !formData.zap_address.trim(),
                )}
                disabled={updateOrder.isPending}
                onChange={(event) =>
                  setFormChanges((current) => ({
                    ...current,
                    zap_address: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                {formData.zap_address.length}/100 characters
              </p>
            </div>
            <SelectField
              id="zap_category"
              label="Category"
              value={formData.zap_category}
              options={Zap_orderszap_category}
              disabled={updateOrder.isPending}
              onChange={(value) =>
                setFormChanges((current) => ({
                  ...current,
                  zap_category: value as OrderFormData["zap_category"],
                }))
              }
            />
            <SelectField
              id="zap_subcategory"
              label="Subcategory"
              value={formData.zap_subcategory}
              options={Zap_orderszap_subcategory}
              disabled={updateOrder.isPending}
              onChange={(value) =>
                setFormChanges((current) => ({
                  ...current,
                  zap_subcategory: value as OrderFormData["zap_subcategory"],
                }))
              }
            />
            <SelectField
              id="statecode"
              label="State"
              value={formData.statecode}
              options={Zap_ordersstatecode}
              allowEmpty={false}
              disabled={updateOrder.isPending}
              onChange={(value) =>
                setFormChanges((current) => ({
                  ...current,
                  statecode: value as OrderFormData["statecode"],
                }))
              }
            />
            <SelectField
              id="statuscode"
              label="Status"
              value={formData.statuscode}
              options={Zap_ordersstatuscode}
              disabled={updateOrder.isPending}
              onChange={(value) =>
                setFormChanges((current) => ({
                  ...current,
                  statuscode: value as OrderFormData["statuscode"],
                }))
              }
            />
            {saveError && (
              <Alert variant="destructive" className="sm:col-span-2">
                <AlertCircleIcon />
                <AlertTitle>Changes were not saved</AlertTitle>
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </form>

      <DetailSection
        title="Record information"
        description="Identifiers, labels, and current Dataverse version."
        items={identityItems}
      />
      <DetailSection
        title="Ownership"
        description="The user, team, and business unit responsible for this record."
        items={ownershipItems}
      />
      <DetailSection
        title="Audit history"
        description="Who created and last modified this record."
        items={auditItems}
      />
      <DetailSection
        title="System and files"
        description="Import, time zone, and file metadata managed by Dataverse."
        items={systemItems}
      />
      </div>
    </main>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  disabled,
  allowEmpty = true,
  onChange,
}: {
  id: string;
  label: string;
  value?: number;
  options: Record<number, string>;
  disabled: boolean;
  allowEmpty?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value?.toString() ?? emptySelectValue}
        disabled={disabled}
        onValueChange={(nextValue) =>
          onChange(
            nextValue === emptySelectValue ? undefined : Number(nextValue),
          )
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && (
            <SelectItem value={emptySelectValue}>Not set</SelectItem>
          )}
          {Object.entries(options).map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
