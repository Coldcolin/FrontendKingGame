import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import type { Slot } from "@/lib/contracts";
import { fileUrl } from "@/lib/api";

export const plateText = { A: "text-plate-a", B: "text-plate-b" } as const;
export const plateBg = { A: "bg-plate-a", B: "bg-plate-b" } as const;
export const plateBorder = { A: "border-plate-a", B: "border-plate-b" } as const;

export function Crosshair({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden className={className}>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 1v22M1 12h22" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
      <Crosshair size={22} />
      DiffArena
    </Link>
  );
}

/** Full-viewport shell: optional 56px nav, flexible main, optional 64px action bar. */
export function AppShell({ header = true, nav, footer, children }: { header?: boolean; nav?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:overflow-visible">
      {header && (
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-rule/60 bg-ink px-6">
          <Wordmark />
          {nav}
        </header>
      )}
      <main className="min-h-0 flex-1">{children}</main>
      {footer && (
        <footer className="flex h-16 shrink-0 items-center justify-between gap-4 border-t border-rule/60 bg-ink px-6 max-lg:sticky max-lg:bottom-0 max-sm:px-4 max-sm:text-[13px] [&>p]:min-w-0 [&>p]:truncate max-sm:[&>p]:line-clamp-2 max-sm:[&>p]:whitespace-normal">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`crop-marks flex min-h-0 flex-col rounded-[2px] border border-rule bg-ink ${className}`}>
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-rule/70 px-4">
        <h2 className="flex min-w-0 items-center gap-2 truncate text-[15px] font-semibold">{title}</h2>
        {actions && <div className="flex shrink-0 items-center gap-3 text-[13px] text-muted">{actions}</div>}
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const styles =
    variant === "primary"
      ? "bg-register text-ink hover:bg-[#fff86b] disabled:bg-register/40"
      : "border border-rule text-paper hover:bg-ink-2 disabled:opacity-50";
  return (
    <button
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[2px] px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function Avatar({ slot, name, url, size = 48 }: { slot: Slot; name: string; url?: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden border-2 bg-ink font-expanded text-[17px] ${plateBorder[slot]} ${plateText[slot]}`}
    >
      {url ? <img src={fileUrl(url)} alt="" className="h-full w-full object-cover" /> : initials || slot}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[2px] border border-rule bg-ink-2 px-1.5 py-0.5 font-mono text-[12px] text-paper">{children}</kbd>;
}

export function CenterMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <Crosshair size={36} className="text-rule" />
      <h1 className="text-xl font-semibold">{title}</h1>
      {children && <div className="max-w-md text-muted">{children}</div>}
    </div>
  );
}
