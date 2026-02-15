"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod";
import {
  Package,
  CheckCircle2,
  Ticket,
  Mail,
  Truck,
  Clock,
  MapPin,
  Thermometer,
  FileX,
  Copy,
  Check,
  MoreVertical,
  Paperclip,
  Share2,
  Bell,
  ExternalLink,
} from "lucide-react";

const anomalySchema = z.object({
  type: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  description: z.string(),
  timestamp: z.string(),
});

export const incidentHandledCardSchema = z.object({
  trackingNumber: z.string().describe("Shipment tracking number"),
  courierCode: z.string().describe("Courier code (e.g. fedex, dhl)"),
  verdict: z.enum(["OK", "Warning", "Failed"]).describe("Audit verdict"),
  slaStatus: z.string().optional().describe("SLA status (on_track, warning, failed)"),
  riskLevel: z.string().optional().describe("Risk level (low, medium, high)"),
  anomalyScore: z.number().optional().describe("Anomaly score 0-100"),
  anomalies: z
    .array(anomalySchema)
    .optional()
    .describe("Detected anomalies"),
  actionsExecuted: z
    .array(z.string())
    .describe("Actions executed (e.g. create_ticket, notify_customer, notify_vendor)"),
  className: z.string().optional(),
});

export type IncidentHandledCardProps = z.infer<typeof incidentHandledCardSchema>;

const getAnomalyIcon = (type: string | undefined) => {
  const t = (type ?? "").toLowerCase();
  if (t.includes("delay")) return Clock;
  if (t.includes("route") || t.includes("deviation")) return MapPin;
  if (t.includes("temperature") || t.includes("cold")) return Thermometer;
  if (t.includes("customs")) return FileX;
  return Clock;
};

const getActionIcon = (action: string | undefined) => {
  const a = (action ?? "").toLowerCase();
  if (a.includes("ticket")) return Ticket;
  if (a.includes("customer")) return Mail;
  if (a.includes("vendor")) return Truck;
  return CheckCircle2;
};

const getActionLabel = (action: string | undefined): string => {
  if (typeof action !== "string") return String(action ?? "");
  const a = action.toLowerCase();
  if (a.includes("ticket")) return "Ticket Created";
  if (a.includes("customer")) return "Customer Notified";
  if (a.includes("vendor")) return "Vendor Notified";
  return action.replace(/_/g, " ");
};

const formatCourier = (code: string | undefined | null): string => {
  if (code == null || typeof code !== "string") return "Unknown";
  return code
    .toUpperCase()
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
};

const buildShareableText = (props: IncidentHandledCardProps): string => {
  const lines = [
    `Shipment Incident Report - ${props.trackingNumber ?? "Unknown"}`,
    `Courier: ${formatCourier(props.courierCode)}`,
    `Verdict: ${props.verdict}${props.slaStatus ? ` (SLA: ${props.slaStatus})` : ""}${props.riskLevel ? ` | Risk: ${props.riskLevel}` : ""}`,
    "",
  ];
  if (props.anomalies?.length) {
    lines.push("Detected Anomalies:");
    props.anomalies.forEach((a) => {
      lines.push(`  • ${a.type} (${a.severity}): ${a.description}`);
    });
    lines.push("");
  }
  if (props.actionsExecuted?.length) {
    lines.push("Actions Executed Automatically:");
    props.actionsExecuted.forEach((a) => lines.push(`  • ${getActionLabel(a)}`));
  }
  return lines.join("\n");
};

export const IncidentHandledCard = React.forwardRef<
  HTMLDivElement,
  IncidentHandledCardProps
>((props, ref) => {
  const {
    trackingNumber,
    courierCode,
    verdict,
    slaStatus,
    riskLevel,
    anomalyScore,
    anomalies = [],
    actionsExecuted = [],
    className,
  } = props;

  const [copied, setCopied] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shareText = buildShareableText(props);
  const subject = `Chain-Guard: Shipment ${trackingNumber} Incident Report`;
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const pdfUrl = `/api/audit-report?tracking=${encodeURIComponent(
    trackingNumber ?? "",
  )}&format=pdf`;
  const excelUrl = `/api/audit-report?tracking=${encodeURIComponent(
    trackingNumber ?? "",
  )}&format=xlsx`;
  const reminderPhone = process.env.NEXT_PUBLIC_REMINDER_PHONE?.replace(/\D/g, "") || "";
  const reminderText = `Reminder: Check Chain-Guard incident report for ${trackingNumber ?? "shipment"}`;
  const reminderWhatsAppUrl = reminderPhone
    ? `https://wa.me/${reminderPhone}?text=${encodeURIComponent(reminderText)}`
    : `https://wa.me/?text=${encodeURIComponent(reminderText)}`;
  const notionUrl = "https://www.notion.so";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject,
          text: shareText,
        });
        setMenuOpen(false);
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
    setMenuOpen(false);
  };

  const verdictColor =
    verdict === "Failed"
      ? "text-red-600 dark:text-red-400"
      : verdict === "Warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-green-600 dark:text-green-400";

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl w-full max-w-full",
        "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl",
        "bg-gradient-to-br from-white via-violet-50/30 to-fuchsia-50/40 dark:from-slate-800/90 dark:via-violet-950/20 dark:to-slate-900/90",
        "border border-white/60 dark:border-slate-600/50",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.9)_inset,0_4px_24px_-4px_rgba(139,92,246,0.15),0_12px_48px_-12px_rgba(0,0,0,0.1)]",
        "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_4px_24px_-4px_rgba(0,0,0,0.4)]",
        "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none",
        "before:bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,transparent_50%,rgba(255,255,255,0.3)_100%)]",
        "dark:before:bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_50%,rgba(255,255,255,0.02)_100%)]",
        className
      )}
    >
      {/* Paper clip on corner - no background, card as paper */}
      <div className="absolute top-2 left-2 z-10">
        <Paperclip className="h-5 w-5 text-slate-400 dark:text-slate-500 -rotate-45 drop-shadow-sm" strokeWidth={2} />
      </div>

      <div className="relative p-5 pl-8 pt-5 sm:pl-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                Shipment Handled: {trackingNumber}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatCourier(courierCode)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className={cn("text-left sm:text-right", verdictColor)}>
              <span className="font-bold text-lg">{verdict}</span>
              {(slaStatus || riskLevel) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[slaStatus, riskLevel].filter(Boolean).join(" · ")}
                  {anomalyScore != null && ` · Score: ${anomalyScore}`}
                </p>
              )}
            </div>
            {/* 3 dots - all share actions */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Share options"
                aria-label="Share options"
              >
                <MoreVertical className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-20">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left"
                  >
                    <Share2 className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCopy();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    )}
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </button>
                  <a
                    href={mailto}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Email
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg className="h-4 w-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href={pdfUrl}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                    Download PDF
                  </a>
                  <a
                    href={excelUrl}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    Download Excel
                  </a>
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left"
                    onClick={() => {
                      handleCopy();
                      window.open(notionUrl, "_blank", "noopener,noreferrer");
                      setMenuOpen(false);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    Send to Notion
                  </button>
                  <a
                    href={reminderWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Bell className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    Set reminder
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Detected Anomalies
            </p>
            <div className="flex flex-wrap gap-2">
              {anomalies.map((a, i) => {
                const Icon = getAnomalyIcon(a.type);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50"
                  >
                    <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-foreground">
                      {a.type.replace(/_/g, " ")} ({a.severity})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions Executed - Timeline view (responsive) */}
        {actionsExecuted.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Actions Executed Automatically
            </p>
            <div className="relative">
              {/* Vertical timeline line */}
              <div
                className="absolute left-[15px] sm:left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-200 dark:from-emerald-500 dark:via-emerald-600 dark:to-emerald-700"
                aria-hidden
              />
              <div className="space-y-0">
                {actionsExecuted.map((action, i) => {
                  const Icon = getActionIcon(action);
                  const isLast = i === actionsExecuted.length - 1;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative flex items-start gap-4 sm:gap-5",
                        !isLast && "pb-4"
                      )}
                    >
                      {/* Timeline dot + icon */}
                      <div className="relative flex-shrink-0 z-10">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 ring-4 ring-white dark:ring-slate-900 shadow-sm">
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium text-foreground">
                          {getActionLabel(action)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Completed
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

IncidentHandledCard.displayName = "IncidentHandledCard";
