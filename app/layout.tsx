import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Puntos",
  description: "Tareas de casa, puntos y regalos para la familia.",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Puntos", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFF8EE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
