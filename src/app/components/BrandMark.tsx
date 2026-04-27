import { Sword } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "../utils/product";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: {
    icon: "w-10 h-10 rounded-xl",
    iconGlyph: "w-5 h-5",
    wordmark: "text-xl",
    tagline: "text-xs",
  },
  md: {
    icon: "w-12 h-12 rounded-2xl",
    iconGlyph: "w-6 h-6",
    wordmark: "text-2xl",
    tagline: "text-sm",
  },
  lg: {
    icon: "w-16 h-16 rounded-[1.4rem]",
    iconGlyph: "w-8 h-8",
    wordmark: "text-4xl md:text-5xl",
    tagline: "text-sm md:text-base",
  },
} as const;

export function BrandMark({
  size = "md",
  showTagline = false,
  showWordmark = true,
  className = "",
}: BrandMarkProps) {
  const styles = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div
        className={`${styles.icon} bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30`}
      >
        <Sword className={`${styles.iconGlyph} text-white`} />
      </div>

      {showWordmark ? (
        <div>
          <div
            className={`${styles.wordmark} font-display font-black tracking-[0.18em] uppercase bg-gradient-to-r from-purple-300 via-purple-100 to-cyan-300 bg-clip-text text-transparent`}
          >
            {APP_NAME}
          </div>
          {showTagline ? (
            <div className={`${styles.tagline} text-muted-foreground`}>{APP_TAGLINE}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
