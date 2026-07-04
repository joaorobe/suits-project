import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import { PwaRegister } from "./pwa-register";
import { ThemeProvider } from "./theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Suits",
  title: {
    default: "Suits",
    template: "%s | Suits",
  },
  description: "Sistema de gestão Suits para aluguel, ajustes e medidas.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Suits",
    statusBarStyle: "black",
    startupImage: "/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2740",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-lg overflow-x-hidden">
        <ThemeProvider />
        <PwaRegister />
        <div className="pointer-events-none fixed right-4 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/90 shadow-lg md:hidden">
          <Image src="/logo.png" alt="Suits" width={69} height={32} className="h-8 w-auto object-contain" />
        </div>
        {children}
      </body>
    </html>
  );
}
