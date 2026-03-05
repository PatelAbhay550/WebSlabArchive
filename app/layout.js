import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WebSlab Archive — Save the Web",
  description:
    "Archive any webpage instantly. Get a permanent snapshot link. Like the Wayback Machine, but simpler.",
  openGraph: {
    title: "WebSlab Archive",
    description: "Archive any webpage instantly. Get a permanent snapshot link.",
    url: "https://webslabarchive.vercel.app",
    siteName: "WebSlab Archive",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
