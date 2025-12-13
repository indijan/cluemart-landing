import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClueMart",
  description: "Markets and other events soon will be enjoyable",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Logo at the top (scrolls away naturally) */}
        <div
          aria-label="ClueMart logo"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: "24px",
            paddingBottom: "16px",
          }}
        >
          <Image
            src="/logo.png"
            alt="ClueMart"
            width={180}
            height={44}
            priority
            style={{ height: "auto", width: "180px" }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}
