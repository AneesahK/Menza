import type { Metadata } from "next";

import "./globals.css";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "Menza Demo",
  description: "Menza take-home assessment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
