import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, strokeWidth = 2, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const StarIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  </Svg>
);
export const CheckIcon = (p: P) => (
  <Svg strokeWidth={2.6} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);
export const XIcon = (p: P) => (
  <Svg strokeWidth={2.6} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const ClockIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 1.5" />
  </Svg>
);
export const PlusIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const MinusIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);
export const LockIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </Svg>
);
export const FamilyIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="8.5" cy="8" r="3" />
    <circle cx="16" cy="9" r="2.5" />
    <path d="M3 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M14 19c0-2 1-4 3-4s4 1.5 4 4" />
  </Svg>
);
export const HomeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 11l8-7 8 7v9H4z" />
    <path d="M10 20v-5h4v5" />
  </Svg>
);
export const GridIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </Svg>
);
export const GiftIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="5" rx="1" />
    <path d="M5 13v8h14v-8M12 8v13M12 8c-2-4-6-4-6-1.5S10 8 12 8zM12 8c2-4 6-4 6-1.5S14 8 12 8z" />
  </Svg>
);
export const SmallGiftIcon = (p: P) => (
  <Svg strokeWidth={3} {...p}>
    <rect x="3" y="8" width="18" height="5" rx="1" />
    <path d="M5 13v8h14v-8M12 8v13" />
  </Svg>
);
export const UserIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </Svg>
);
export const CalendarIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);
export const ListIcon = (p: P) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.2" />
    <circle cx="4.5" cy="12" r="1.2" />
    <circle cx="4.5" cy="18" r="1.2" />
  </Svg>
);
export const TrashIcon = (p: P) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Svg>
);
export const BackIcon = (p: P) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const ChevronRightIcon = (p: P) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
export const ExternalIcon = (p: P) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />
  </Svg>
);
export const LinkIcon = (p: P) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
  </Svg>
);
export const CameraIcon = (p: P) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
);
export const SendIcon = (p: P) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M4 12l16-8-6 16-3-7z" />
  </Svg>
);
export const BoxIcon = (p: P) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M4 7l8-4 8 4v10l-8 4-8-4z" />
    <path d="M4 7l8 4 8-4M12 11v10" />
  </Svg>
);
export const PencilIcon = (p: P) => (
  <Svg strokeWidth={2.2} {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="M13.5 6.5l4 4" />
  </Svg>
);
export const SettingsIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </Svg>
);
export const BackspaceIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 5H9l-6 7 6 7h12z" />
    <path d="M17 9l-6 6M11 9l6 6" />
  </Svg>
);
