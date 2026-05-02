import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SystemCommandListener } from "@/components/layout/system-command-listener";

export const metadata: Metadata = {
  title: "CADD Centre Lanka",
  description: "Academic & Student Management System - Institute Management System",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background"
        style={{
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {children}
        <Toaster position="top-center" richColors />
        <SystemCommandListener />
      </body>
    </html>
  );
}
