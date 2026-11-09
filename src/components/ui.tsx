import type { ReactNode, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Tone } from "../lib/format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------- Brand ---------- */

export function Logo({
  className,
  size = "md",
  showWordmark = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}) {
  const mark = size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-10";
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <span
        aria-hidden="true"
        className={cn("grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm", mark)}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-3/5">
          <path
            d="M7 20V4h6.2a5 5 0 0 1 0 10H7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className={cn("font-display text-foreground", text)}>
          Park<span className="text-primary">Share</span>
        </span>
      )}
    </span>
  );
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-4 text-sm",
    size === "lg" && "h-12 px-5 text-base",
    variant === "primary" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark",
    variant === "outline" && "border border-input bg-card text-foreground hover:border-primary/40 hover:bg-muted",
    variant === "ghost" && "text-primary hover:bg-accent",
    variant === "danger" && "border border-destructive/25 bg-card text-destructive hover:bg-danger-muted",
    className,
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card text-card-foreground", className)}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {action}
    </div>
  );
}

const toneClasses: Record<Tone, string> = {
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning-foreground border-warning/30",
  danger: "bg-danger-muted text-destructive border-destructive/20",
  info: "bg-info-muted text-info border-info/20",
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-accent text-accent-foreground border-primary/15",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning-foreground",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function OccupancyBar({
  occupied,
  total,
  className,
}: {
  occupied: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((occupied / total) * 100)) : 0;
  const tone = pct >= 95 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Occupancy"
      >
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{pct}% in use</span>
        <span>{Math.max(0, total - occupied)} free</span>
      </div>
    </div>
  );
}

/* ---------- Feedback ---------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 grid size-12 place-items-center rounded-full bg-accent text-primary">{icon}</div>
      )}
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "danger",
  title,
  children,
  className,
}: {
  tone?: "danger" | "warning" | "success" | "info";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "whitespace-pre-line rounded-xl border p-4 text-sm leading-6",
        tone === "danger" && "border-destructive/20 bg-danger-muted text-destructive",
        tone === "warning" && "border-warning/30 bg-warning-muted text-warning-foreground",
        tone === "success" && "border-success/20 bg-success-muted text-success",
        tone === "info" && "border-info/20 bg-info-muted text-info",
        className,
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  );
}

export function Loading({ children = "Loading…" }: { children?: ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      {children}
    </p>
  );
}

/* ---------- Forms ---------- */

export function Field({
  label,
  htmlFor,
  hint,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-50";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, "h-11", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputBase, "h-11 pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "py-2.5", className)} {...props} />;
}

/* ---------- QR pass ---------- */

/** A real, scannable QR code of the value the backend issued. */
export function QrPass({ value, className }: { value: string; className?: string }) {
  return (
    <div className={cn("mx-auto w-44 rounded-2xl border border-border bg-white p-3", className)}>
      <QRCodeSVG value={value} size={512} marginSize={0} className="h-auto w-full" aria-label="Booking QR pass" />
    </div>
  );
}
