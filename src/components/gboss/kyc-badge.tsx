import { AlertTriangle, BadgeCheck, Clock } from "lucide-react";
import type { KycStatus } from "@/lib/gboss/kyc";
import { cn } from "@/lib/utils";

/** Ti "check" ble a — parèt bò kote non biznis la lè KYC apwouve. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("inline-block size-4 shrink-0 fill-kpi-blue text-white", className)}
      aria-label="Biznis verifye"
    />
  );
}

/** Badj/rapèl vizib pou biznis ki poko fè KYC oswa ki rejte. Pa gen okenn blokaj. */
export function KycStatusBadge({
  status,
  onClick,
  className,
}: {
  status: KycStatus;
  onClick?: () => void;
  className?: string;
}) {
  if (status === "approved") return className ? <VerifiedBadge className={className} /> : <VerifiedBadge />;

  const config = {
    not_submitted: {
      label: "Fè verifikasyon KYC",
      classes: "bg-status-low text-kpi-orange",
      icon: AlertTriangle,
    },
    pending: {
      label: "KYC an revizyon",
      classes: "bg-kpi-blue/10 text-kpi-blue",
      icon: Clock,
    },
    rejected: {
      label: "KYC rejte",
      classes: "bg-status-crit text-kpi-red",
      icon: AlertTriangle,
    },
  }[status];

  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80",
        config.classes,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </button>
  );
}
