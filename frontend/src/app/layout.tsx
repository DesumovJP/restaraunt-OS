import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { UrqlProvider } from "@/providers/urql-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Restaurant OS",
  description: "Сучасна система управління рестораном",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Restaurant OS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B1B3B", // Navy 950 - primary brand color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <UrqlProvider>
          {children}
        </UrqlProvider>
      </body>
    </html>
  );
}
