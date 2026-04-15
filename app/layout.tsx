import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Game Prototype",
  description: "Manual two-player central bank market game prototype."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
