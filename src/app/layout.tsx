import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Professional Work", description: "Tu trabajo habla por ti. Descubre profesionales y conexiones locales." };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="es"><body>{children}</body></html>; }
