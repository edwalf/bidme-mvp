import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "BidMe — Smart Procurement",
    template: "%s · BidMe",
  },
  description:
    "Publica una necesidad de compra una sola vez. BidMe encuentra automáticamente a los proveedores calificados y coordina el proceso de cotización, de forma privada.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "BidMe — Smart Procurement",
    description: "Licitaciones privadas B2B con matching automático de proveedores.",
    images: ["/logo-full.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1B2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
