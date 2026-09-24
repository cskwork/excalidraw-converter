import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";

const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const legend = Martian_Mono({ subsets: ["latin"], variable: "--font-legend", display: "swap" });

const title = "Excalidraw Converter — Turn anything into diagrams";
const description =
  "Convert text, documents and images into editable Excalidraw diagrams with the Claude Agent SDK.";

export const metadata: Metadata = {
  metadataBase: new URL("https://excalidraw-converter.vercel.app"),
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Excalidraw Converter" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d3cec4" },
    { media: "(prefers-color-scheme: dark)", color: "#2d3135" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${legend.variable}`}>
      <body className={body.className}>{children}</body>
    </html>
  );
}
