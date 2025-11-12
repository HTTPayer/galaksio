import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { Navbar, Footer } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Galaksio",
  description: "On-chain USDC → Instant cloud compute & storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
