import type { Metadata } from "next";
import { AppProviders } from "@/components/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cline",
  description:
    "Finance operating system for Nigerian SMEs with money-in visibility, payment control, and transaction intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
