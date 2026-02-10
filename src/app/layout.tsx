import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MakeScript — Add Motion Graphics to Any Video",
  description:
    "Upload your video, get automatic transcripts, and add stunning motion graphics with AI. Transform any video with animated subtitles, lower thirds, emoji reactions, and more.",
  keywords: [
    "AI video editor",
    "motion graphics",
    "animated subtitles",
    "video overlays",
    "remotion",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
