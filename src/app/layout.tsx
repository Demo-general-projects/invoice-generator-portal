import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Mrs_Saint_Delafield } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${script.variable} antialiased`}
    >
      <body className="min-h-dvh">
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: "print:hidden" }} />
      </body>
    </html>
  );
}
