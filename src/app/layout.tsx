import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./providers";

export const metadata: Metadata = {
  title: "MakeScript — AI Video Editor with Motion Graphics",
  description:
    "Upload raw footage. AI edits, color-grades, captions, and exports in seconds. No timeline, no learning curve.",
  keywords: [
    "AI video editor",
    "motion graphics",
    "video overlays",
    "remotion",
    "video editing online",
    "AI transcription",
    "animated captions",
    "auto video editor",
    "zero click editor",
    "MakeScript",
  ],
  openGraph: {
    title: "MakeScript — AI Video Editor with Motion Graphics",
    description:
      "Upload raw footage. AI edits, color-grades, captions, and exports in seconds.",
    type: "website",
    locale: "en_US",
    siteName: "MakeScript",
  },
  twitter: {
    card: "summary_large_image",
    title: "MakeScript — AI Video Editor",
    description:
      "Upload raw footage. AI does the rest.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/makescript-logo.jpg" />
        <link rel="apple-touch-icon" href="/makescript-logo.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
