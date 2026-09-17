import type { Metadata } from "next";
import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "NextCBT — Computer Based Test",
  description: "Platform ujian digital untuk guru dan siswa.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}<CookieConsent /></body></html>;
}
