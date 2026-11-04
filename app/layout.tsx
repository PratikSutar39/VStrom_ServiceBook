import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ridebook · V-Strom SX",
  description: "Your Suzuki V-Strom SX maintenance log, trip checks and monthly review.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
