import type { Metadata } from "next";
import { Inter, Instrument_Serif, Mrs_Saint_Delafield } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});
const script = Mrs_Saint_Delafield({ variable: "--font-script", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Ledgerline · Invoice generator",
  description: "Create, preview, print and email professional invoices.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${script.variable} antialiased`}
    >
      <body className="min-h-dvh">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
