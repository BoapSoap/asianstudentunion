import Link from "next/link";
import type { ReactNode } from "react";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type InfoVariant = "info" | "warning" | "error";

export function AdminSectionShell({
  title,
  description,
  role,
  backHref = "/admin",
  backLabel = "Back to Dashboard",
  eyebrow = "Admin",
  children,
}: {
  title: string;
  description: string;
  role: ProfileRole;
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <main
      className="flex min-h-screen w-full justify-center pb-24 md:pb-32"
      style={{ paddingTop: "clamp(12rem, 18vh, 20rem)" }}
    >
      <div className="w-full max-w-6xl px-4 flex flex-col gap-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">{eyebrow}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {backHref && (
                <Link
                  href={backHref}
                  className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
                >
                  ← {backLabel}
                </Link>
              )}
              <div>
                <h1 className="text-3xl font-extrabold text-white">{title}</h1>
                <p className="text-sm text-white/70">{description}</p>
              </div>
            </div>
            <div className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
              {role}
            </div>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}

export function AdminInfoCard({
  title,
  body,
  variant = "info",
}: {
  title: string;
  body: string;
  variant?: InfoVariant;
}) {
  const variants: Record<InfoVariant, string> = {
    info: "border-white/10 bg-white/5 text-white",
    warning: "border-amber-400/30 bg-amber-500/10 text-white",
    error: "border-red-500/40 bg-red-600/15 text-white",
  };

  return (
    <div className={`rounded-2xl border px-6 py-5 shadow-xl backdrop-blur ${variants[variant]}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-white/80">{body}</p>
    </div>
  );
}

export function AdminActionCard({
  title,
  description,
  badge,
  href,
  disabled,
}: {
  title: string;
  description: string;
  badge?: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`group relative h-full rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 ${
        disabled ? "opacity-70" : ""
      }`}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-white/70">{description}</p>
        </div>
        {badge && (
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className="block h-full w-full">
        {content}
      </Link>
    );
  }

  return <div className="h-full w-full">{content}</div>;
}
