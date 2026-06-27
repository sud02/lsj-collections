import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import Providers from "./providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lsjcollections.com"),
  title: {
    default: "LSJ Collections — Premium Hallmark Jewellery, Tirupati",
    template: "%s | LSJ Collections",
  },
  description:
    "Shop certified hallmark gold, silver & diamond jewellery from LSJ Collections, Tirupati. Timeless designs, transparent pricing, free shipping across India.",
  keywords: [
    "LSJ Collections",
    "hallmark jewellery",
    "gold jewellery Tirupati",
    "diamond jewellery India",
    "silver jewellery online",
    "bridal jewellery Andhra Pradesh",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "LSJ Collections",
    url: "https://lsjcollections.com",
    title: "LSJ Collections — Premium Hallmark Jewellery, Tirupati",
    description:
      "Certified hallmark gold, silver & diamond jewellery. Crafted in Tirupati, delivered across India.",
    images: [{ url: "/logo_lsj.png", width: 1508, height: 1114, alt: "LSJ Collections" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LSJ Collections",
    description: "Premium hallmark jewellery from Tirupati.",
    images: ["/logo_lsj.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo_lsj.png", type: "image/png" },
    ],
    apple: "/logo_lsj.png",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#c49a5c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-dark antialiased pb-16 lg:pb-0">
        <Providers>
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
