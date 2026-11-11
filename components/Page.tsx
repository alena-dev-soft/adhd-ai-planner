import clsx from "clsx";
import type { ReactNode } from "react";

/** One sheet of the planner (left = week, right = day). */
export function Page({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={clsx(
        "@container px-5 py-10 min-[900px]:min-h-[900px] min-[900px]:px-10 min-[900px]:py-14",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Page heading: small, uppercase, light, muted (prototype `.page-title`). */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-light uppercase tracking-[1px] text-muted-text">{children}</h2>;
}

/** A titled block of tasks with the paper-planner quoted subtitle. */
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
    <div className="mb-10">
      <h3 className="mb-1 text-[0.8rem] font-light uppercase tracking-[1px] text-ink">{title}</h3>
      <p className="mb-4 text-xs italic text-muted-text">&ldquo;{subtitle}&rdquo;</p>
      {children}
    </div>
  );
}
