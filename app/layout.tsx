import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";
import BackgroundVideo from "./BackgroundVideo";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TalkDoc",
  description: "Smart Medication Assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${comfortaa.className} antialiased`}>
        <BackgroundVideo />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
