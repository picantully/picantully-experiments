import type { Metadata } from "next";
import { Space_Grotesk, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// The design-system tokens reference these families by literal name
// ("Space Grotesk", "Manrope", "IBM Plex Mono"), so next/font self-hosts them
// and Next emits the matching @font-face under those family names.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Picantully Focus · Recuperá tu foco, con onda",
  description:
    "Cuando estás por caer en el scroll, aparece Picantully: un personaje que te frena con humor y te devuelve el control. El bloqueador que no vas a querer desinstalar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.className} ${manrope.className} ${ibmPlexMono.className}`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
