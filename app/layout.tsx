import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AdminToggle from "./components/AdminToggle";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "CourtSense",
  description: "CourtSense — court analytics and player profiles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <AdminToggle />
        {children}
      </body>
    </html>
  );
}
