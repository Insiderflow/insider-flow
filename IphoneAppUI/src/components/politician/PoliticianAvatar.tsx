import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPoliticianImagePath } from "@/lib/politicianImageUrl";
import type { Party } from "@/data/mockData";

type PoliticianAvatarProps = {
  politicianId?: string;
  name: string;
  imageUrl?: string | null;
  party?: Party;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "h-10 w-10 rounded-xl text-[10px]",
  md: "h-14 w-14 rounded-xl text-sm",
  lg: "h-20 w-20 rounded-2xl text-lg",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function PoliticianAvatar({
  politicianId,
  name,
  imageUrl,
  party,
  size = "sm",
  className,
}: PoliticianAvatarProps) {
  const [failed, setFailed] = useState(false);
  const src =
    !failed && politicianId
      ? imageUrl || getPoliticianImagePath(politicianId, name)
      : null;

  const ring =
    party === "R"
      ? "ring-1 ring-red-500/40"
      : party === "D"
        ? "ring-1 ring-blue-500/40"
        : "";

  if (!src) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-white/10 font-bold text-muted-foreground",
          sizeClass[size],
          ring,
          className
        )}
        aria-hidden
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-cover", sizeClass[size], ring, className)}
    />
  );
}
