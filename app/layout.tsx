import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ANH-here - Presence Management System",
  description: "Complete API for managing presence system, employees, shifts and permissions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full min-h-svh">
      <body className={`${inter.variable} font-sans antialiased h-full min-h-svh overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
