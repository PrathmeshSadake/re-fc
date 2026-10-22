import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "re-fc resume builder",
  description: "A small resume builder with a live preview, section reorder, and client-side PDF export.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
