import { UserRound } from "lucide-react";

export type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
  ariaLabel?: string;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

const fallbackColors = [
  "bg-sabio text-anime-main",
  "bg-sabio-dim text-cream-primary",
  "bg-sabio-light text-anime-main",
  "bg-cream-secondary text-anime-main",
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const getDeterministicColor = (name: string) => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % fallbackColors.length;
  return fallbackColors[index];
};

export const Avatar = ({ name, imageUrl, size = "md", ariaLabel }: AvatarProps) => {
  const initials = getInitials(name || "?");
  const label = ariaLabel ?? `Avatar de ${name}`;

  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex items-center justify-center overflow-hidden rounded-full ${sizeClasses[size]} ${imageUrl ? "" : getDeterministicColor(name || "?")}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="font-black uppercase tracking-tighter">{initials || <UserRound size={18} />}</span>
      )}
    </span>
  );
};
