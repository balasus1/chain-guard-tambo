"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod";
import { Mail, MessageSquare, X } from "lucide-react";

/**
 * Zod schema for TicketForm
 */
export const ticketFormSchema = z.object({
  trackingNumber: z.string().describe("Tracking number for the ticket"),
  subject: z.string().optional().describe("Subject/title of the ticket"),
  anomalyType: z.string().optional().describe("Type of anomaly being reported"),
  className: z.string().optional().describe("Additional CSS classes"),
  onSubmit: z
    .function()
    .args(
      z.object({
        trackingNumber: z.string(),
        subject: z.string(),
        message: z.string(),
        email: z.string().email(),
        priority: z.enum(["low", "medium", "high"]),
      }),
    )
    .returns(z.void())
    .optional()
    .describe("Callback when form is submitted"),
  onClose: z
    .function()
    .returns(z.void())
    .optional()
    .describe("Callback to close the form"),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type TicketFormProps = z.infer<typeof ticketFormSchema>;

/**
 * TicketForm Component
 * 
 * Form for logging tickets or sending emails about shipment issues.
 * 
 * @example
 * ```tsx
 * <TicketForm
 *   trackingNumber="1Z999AA10123456784"
 *   anomalyType="delay"
 *   onSubmit={(data) => console.log("Submit:", data)}
 *   onClose={() => setShowForm(false)}
 * />
 * ```
 */
export const TicketForm = React.forwardRef<HTMLDivElement, TicketFormProps>(
  (
    {
      className,
      trackingNumber,
      subject: initialSubject,
      anomalyType,
      onSubmit,
      onClose,
      ...props
    },
    ref,
  ) => {
    const [email, setEmail] = React.useState("");
    const [subject, setSubject] = React.useState(
      initialSubject || `Issue with shipment ${trackingNumber}`,
    );
    const [message, setMessage] = React.useState("");
    const [priority, setPriority] = React.useState<"low" | "medium" | "high">("medium");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!email || !subject || !message) {
        return;
      }

      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onSubmit) {
        onSubmit({
          trackingNumber,
          subject,
          message,
          email,
          priority,
        });
      }

      setIsSubmitting(false);
      setIsSubmitted(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        if (onClose) {
          onClose();
        }
      }, 2000);
    };

    if (isSubmitted) {
      return (
        <div
          ref={ref}
          className={cn(
            "w-full rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-6",
            className,
          )}
          {...props}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Ticket Submitted Successfully
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                We've received your request and will respond shortly.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-border bg-background shadow-lg",
          className,
        )}
        {...props}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Report Issue / Log Ticket
              </h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                disabled
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Your Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Subject <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high")
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Message <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {anomalyType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Anomaly type: {anomalyType.replace(/_/g, " ")}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !email || !subject || !message}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  },
);

TicketForm.displayName = "TicketForm";
