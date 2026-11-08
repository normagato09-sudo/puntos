/** Avatar cuadrado redondeado con una carita de trazo y el color del hijo. */
export function Avatar({
  color,
  seed,
  size = 140,
  radius,
}: {
  color: string;
  seed: number;
  size?: number;
  radius?: number;
}) {
  const face = seed % 3;
  const icon = Math.round(size * 0.56);
  return (
    <div
      className="flex flex-none items-center justify-center"
      style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.16), background: color }}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={size > 80 ? 1.6 : 1.9}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        {face === 0 && (
          <>
            <circle cx="9" cy="10" r="0.8" fill="#FFFFFF" />
            <circle cx="15" cy="10" r="0.8" fill="#FFFFFF" />
          </>
        )}
        {face === 1 && <path d="M7.8 10h2.4M13.8 10h2.4" />}
        {face === 2 && <path d="M8 10.6c.5-.9 1.7-.9 2.2 0M13.8 10.6c.5-.9 1.7-.9 2.2 0" />}
        <path d="M8.5 14.5c1.8 2 5.2 2 7 0" />
      </svg>
    </div>
  );
}
