import { StarIcon } from "./icons";

export function PointsPill({ points }: { points: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-sun">
      <StarIcon filled size={18} />
      <span className="font-display text-lg font-semibold">{points}</span>
      <span className="text-[13px] font-bold text-white">{points === 1 ? "punto" : "puntos"}</span>
    </div>
  );
}

export function RewardThumb({ photo, tone }: { photo: string | null; tone: "blue" | "sun" | "grey" }) {
  const bg = tone === "blue" ? "bg-brand-soft text-brand" : tone === "sun" ? "bg-sun-chip text-sun-ink" : "bg-track text-muted";
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className="h-16 w-16 flex-none rounded-[14px] object-cover" />;
  }
  return (
    <div className={`flex h-16 w-16 flex-none items-center justify-center rounded-[14px] ${bg}`}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7l8-4 8 4v10l-8 4-8-4z" />
        <path d="M4 7l8 4 8-4M12 11v10" />
      </svg>
    </div>
  );
}
