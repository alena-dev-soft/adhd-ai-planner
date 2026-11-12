import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * One planner page (`.page` from themes.css). Layout only via Tailwind:
 * padding 32px (20px on phones), children stacked with a 22px gap.
 */
export function Page({
  className,
  label,
  children,
}: {
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className={clsx("page @container flex min-w-0 flex-col gap-[22px] p-5 min-[600px]:p-8", className)}
    >
      {children}
    </section>
  );
}

/** Page heading in the theme's heading font. */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h2 className="head text-xl leading-snug">{children}</h2>;
}

/** A titled block of tasks: `.head` name + `.sub` subtitle (both from lib/theme.ts). */
export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="head text-base leading-snug">{title}</h3>
      <p className="sub mb-2">&ldquo;{subtitle}&rdquo;</p>
      {children}
    </div>
  );
}
