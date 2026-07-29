import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import { defaultLocale, isLocale } from "@/lib/i18n";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Alexandre BOISSEL — Portfolio",
    template: "%s",
  },
  applicationName: site.nameDisplay,
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#12141c" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const raw = headerStore.get("x-locale") ?? defaultLocale;
  const locale = isLocale(raw) ? raw : defaultLocale;

  return (
    <html lang={locale} className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="page-atmosphere antialiased font-sans">{children}</body>
    </html>
  );
}
