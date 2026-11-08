import { ImageResponse } from "next/og";

export const BRAND = "#2F6FEB";
export const SUN = "#FFC94D";
export const CREAM = "#FFF8EE";

const STAR = "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z";

/**
 * Icono de la app: estrella amarilla sobre fondo azul.
 * - "rounded": esquinas redondeadas con fondo transparente (icono normal).
 * - "full": cuadrado completo (iPhone redondea él solo; favicon).
 * - "maskable": cuadrado completo con la estrella dentro de la zona segura (80 %).
 */
export function iconResponse(size: number, variant: "rounded" | "full" | "maskable") {
  const star = Math.round(size * (variant === "maskable" ? 0.5 : 0.64));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND,
          borderRadius: variant === "rounded" ? Math.round(size * 0.22) : 0,
        }}
      >
        <svg width={star} height={star} viewBox="0 0 24 24" style={{ marginTop: Math.round(size * 0.01) }}>
          <path d={STAR} fill={SUN} stroke={SUN} strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}

/** Pantalla de arranque de iPhone: fondo crema con el icono en el centro. */
export function splashResponse(width: number, height: number) {
  const icon = Math.round(Math.min(width, height) * 0.28);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
        }}
      >
        <div
          style={{
            width: icon,
            height: icon,
            borderRadius: Math.round(icon * 0.22),
            background: BRAND,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={Math.round(icon * 0.64)} height={Math.round(icon * 0.64)} viewBox="0 0 24 24">
            <path d={STAR} fill={SUN} stroke={SUN} strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    ),
    { width, height },
  );
}

/** Tamaños de pantalla de iPhone habituales (px de dispositivo, ancho x alto, ratio). */
export const IPHONE_SPLASHES: { w: number; h: number; dpr: number }[] = [
  { w: 1320, h: 2868, dpr: 3 }, // 16 Pro Max
  { w: 1206, h: 2622, dpr: 3 }, // 16 Pro
  { w: 1290, h: 2796, dpr: 3 }, // 14/15 Pro Max, 15/16 Plus
  { w: 1179, h: 2556, dpr: 3 }, // 14 Pro, 15, 16
  { w: 1284, h: 2778, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 1170, h: 2532, dpr: 3 }, // 12/13/14
  { w: 1125, h: 2436, dpr: 3 }, // X/XS/11 Pro, mini
  { w: 1242, h: 2688, dpr: 3 }, // XS Max/11 Pro Max
  { w: 828, h: 1792, dpr: 2 }, // XR/11
  { w: 750, h: 1334, dpr: 2 }, // SE 2/3, 8
];
