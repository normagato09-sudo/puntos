import type { Metadata } from "next";
import { OfflineScreen } from "./offline-screen";

export const metadata: Metadata = { title: "Puntos · sin conexión" };

// Página estática que el service worker guarda al instalarse. Se muestra cuando
// no hay conexión y la pantalla pedida no está en caché.
export default function OfflinePage() {
  return <OfflineScreen />;
}
