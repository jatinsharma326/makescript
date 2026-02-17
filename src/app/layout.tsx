import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./providers";

export const metadata: Metadata = {
  title: "MakeScript — AI Video Editor with Motion Graphics",
  description:
    "Upload your video, get AI-powered transcripts, and add stunning motion graphics automatically. Professional lower thirds, kinetic text, particle effects, and 30+ animated scenes. Free to use.",
  keywords: [
    "AI video editor",
    "motion graphics",
    "video overlays",
    "remotion",
    "video editing online",
    "AI transcription",
    "animated overlays",
    "lower third generator",
    "video effects",
    "SaaS video editor",
  ],
  openGraph: {
    title: "MakeScript — AI Video Editor with Motion Graphics",
    description:
      "Add professional motion graphics to any video with AI. Upload, transcribe, enhance, export.",
    type: "website",
    locale: "en_US",
    siteName: "MakeScript",
  },
  twitter: {
    card: "summary_large_image",
    title: "MakeScript — AI Video Editor",
    description:
      "Add professional motion graphics to any video with AI. Free to use.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
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
