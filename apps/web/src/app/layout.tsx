import type { Metadata } from "next";
import { inter, outfit } from "@/lib/fonts";
import { ToastProvider } from "@/providers/toast-provider";
import { DeviceIdentificationProvider } from "@/providers/device-identification-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RescueLink Taguig",
  description: "Emergency Response System for Taguig City",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <ToastProvider />
        <DeviceIdentificationProvider />
      </body>
    </html>
  );
}
