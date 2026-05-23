import { ListingStatus } from "@/lib/types";

const STYLES: Record<ListingStatus, string> = {
  active: "bg-[var(--color-good-soft)] text-[var(--color-good)]",
  pending: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
  sold: "bg-gray-900 text-white",
  expired: "bg-gray-200 text-gray-600",
};

const LABEL: Record<ListingStatus, string> = {
  active: "Active",
  pending: "Sale pending",
  sold: "Sold",
  expired: "Expired",
};

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: ListingStatus;
  size?: "sm" | "lg";
}) {
  const dims =
    size === "lg"
      ? "px-3 py-1.5 text-sm font-semibold"
      : "px-2 py-0.5 text-xs font-semibold";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${dims} ${STYLES[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}

export function ListingStatusOverlay({ status }: { status: ListingStatus }) {
  if (status === "active") return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <StatusBadge status={status} size="lg" />
    </div>
  );
}
