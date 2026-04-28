"use client";

import "./globals.css";
import { Toaster } from "react-hot-toast";

import { BottomNav } from "@/components/bottom-nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <main className="mx-auto min-h-screen max-w-3xl px-4 pb-24 pt-4">
          {children}
        </main>
        <Toaster position="top-center" />
        <BottomNav />
      </body>
    </html>
  );
}
