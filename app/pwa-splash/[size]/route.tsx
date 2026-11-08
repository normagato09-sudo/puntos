import { IPHONE_SPLASHES, splashResponse } from "@/lib/pwa-art";

export const dynamic = "force-static";

export function generateStaticParams() {
  return IPHONE_SPLASHES.map(({ w, h }) => ({ size: `${w}x${h}` }));
}

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = IPHONE_SPLASHES.find(({ w, h }) => `${w}x${h}` === size);
  if (!s) return new Response("Not found", { status: 404 });
  return splashResponse(s.w, s.h);
}
