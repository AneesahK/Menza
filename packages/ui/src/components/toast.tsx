"use client";

import { useEffect, useState } from "react";
import { PiAlertCircleStroke } from "@demo/icons/pika/stroke/alerts";
import { PiCheckTickSingleStroke } from "@demo/icons/pika/stroke/general";
import { cn } from "../lib/cn";

type ToastProps = {
  message: string;
  variant?: "success" | "error";
  duration?: number;
  onClose?: () => void;
};

export function Toast({
  message,
  variant = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, [message, variant]);

  useEffect(() => {
    const dismissTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => window.clearTimeout(dismissTimer);
  }, [duration, message, variant]);

  useEffect(() => {
    if (!isVisible) {
      const closeTimer = window.setTimeout(() => {
        onClose?.();
      }, 150);

      return () => window.clearTimeout(closeTimer);
    }
  }, [isVisible, onClose]);

  const isSuccess = variant === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-4 right-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg transition-all duration-150",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        isSuccess ? "border-accent/40 text-foreground" : "border-destructive/40",
      )}
    >
      <div className={cn("mt-0.5", isSuccess ? "text-accent" : "text-destructive")}>
        {isSuccess ? (
          <PiCheckTickSingleStroke className="size-4" />
        ) : (
          <PiAlertCircleStroke className="size-4" />
        )}
      </div>
      <p className={cn("leading-5", isSuccess ? "text-foreground" : "text-destructive")}>
        {message}
      </p>
    </div>
  );
}
