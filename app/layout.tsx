import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADH Planner",
  description: "A calm, paper-like productivity planner.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-cream font-serif text-ink">{children}</body>
    </html>
  );
}
