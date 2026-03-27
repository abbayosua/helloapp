import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HelloApp - Chat with your friends!",
  description: "HelloApp - A modern messaging app to chat with your friends in real-time. Send messages, create groups, and stay connected.",
  keywords: ["HelloApp", "Chat", "Messaging", "Real-time", "WhatsApp clone", "Next.js", "React"],
  authors: [{ name: "abbayosua" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "HelloApp - Chat with your friends!",
    description: "A modern messaging app to chat with your friends in real-time",
    url: "https://helloapp.vercel.app",
    siteName: "HelloApp",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HelloApp - Chat with your friends!",
    description: "A modern messaging app to chat with your friends in real-time",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
