import type { Metadata } from "next";
import {
  Alegreya,
  Alegreya_SC,
  Cinzel,
  Cormorant_Garamond,
  EB_Garamond,
  Marcellus,
} from "next/font/google";
import "./globals.css";

// Theme fonts (docs/ui/DESIGN.md §2). themes.css picks them per theme via --font-head / --font-body.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-cinzel" });
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
});
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-marcellus" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
const alegreya = Alegreya({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-alegreya",
});
const alegreyaSc = Alegreya_SC({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-alegreya-sc" });

const fontVars = [cinzel, ebGaramond, marcellus, cormorant, alegreya, alegreyaSc].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "ADH Planner",
  description: "A calm productivity planner with fantasy themes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full bg-bg font-body text-ink">{children}</body>
    </html>
  );
}
