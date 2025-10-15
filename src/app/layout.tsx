import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Game Simulator",
  description: "A beautiful chess game simulator with two AI players",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
