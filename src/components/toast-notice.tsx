"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastNoticeProps = {
  title: string;
  description?: string;
  variant?: "success" | "error";
};

export function ToastNotice({
  title,
  description,
  variant = "success",
}: ToastNoticeProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;

  useEffect(() => {
    const dismissTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, 6000);

    return () => {
      window.clearTimeout(dismissTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "fixed right-4 top-4 z-50 w-[min(calc(100vw-2rem),24rem)] rounded-lg border bg-background p-3 text-sm shadow-lg ring-1 ring-border",
        variant === "error" ? "border-destructive/30" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-4 shrink-0",
            variant === "error" ? "text-destructive" : "text-foreground",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {description ? (
            <p className="mt-1 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss notification"
          onClick={() => setIsVisible(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
