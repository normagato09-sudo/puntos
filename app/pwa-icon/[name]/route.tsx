import { iconResponse } from "@/lib/pwa-art";

export const dynamic = "force-static";

const ICONS: Record<string, [number, "rounded" | "full" | "maskable"]> = {
  "192": [192, "rounded"],
  "512": [512, "rounded"],
  "maskable-192": [192, "maskable"],
  "maskable-512": [512, "maskable"],
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const icon = ICONS[name];
  if (!icon) return new Response("Not found", { status: 404 });
  return iconResponse(icon[0], icon[1]);
}
