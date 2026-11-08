import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { SyncProvider } from "@/components/sync-provider";
import { IPHONE_SPLASHES } from "@/lib/pwa-art";
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
  applicationName: "Puntos",
  description: "Tareas de casa, puntos y regalos para la familia.",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Puntos",
    statusBarStyle: "default",
    startupImage: IPHONE_SPLASHES.map(({ w, h, dpr }) => ({
      url: `/pwa-splash/${w}x${h}`,
      media: `(device-width: ${w / dpr}px) and (device-height: ${h / dpr}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF8EE",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Guarda el aviso de instalación de Chrome aunque llegue antes de que React arranque.
const captureInstallPrompt = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__puntosInstall=e;window.dispatchEvent(new Event('puntos-installable'));});window.addEventListener('appinstalled',function(){window.__puntosInstall=null;window.dispatchEvent(new Event('puntos-installed'));});`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fredoka.variable} ${nunito.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: captureInstallPrompt }} />
      </head>
      <body className="min-h-dvh antialiased">
        <SyncProvider>{children}</SyncProvider>
      </body>
    </html>
  );
}
