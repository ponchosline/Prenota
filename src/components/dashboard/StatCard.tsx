interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaType?: "up" | "neutral";
  tinted?: boolean;
  accent?: "mint" | "blue" | "orange" | "purple";
}

const accentStyles: Record<string, { bg: string; border: string; icon: string }> = {
  mint: {
    bg: "bg-gradient-to-br from-[#34C75908] to-[#34C75915]",
    border: "border-[#34C75930]",
    icon: "text-[#34C759]",
  },
  blue: {
    bg: "bg-gradient-to-br from-[#007AFF08] to-[#007AFF15]",
    border: "border-[#007AFF30]",
    icon: "text-[#007AFF]",
  },
  orange: {
    bg: "bg-gradient-to-br from-[#FF950008] to-[#FF950015]",
    border: "border-[#FF950030]",
    icon: "text-[#FF9500]",
  },
  purple: {
    bg: "bg-gradient-to-br from-[#AF52DE08] to-[#AF52DE15]",
    border: "border-[#AF52DE30]",
    icon: "text-[#AF52DE]",
  },
};

export default function StatCard({
  label,
  value,
  delta,
  deltaType = "neutral",
  tinted,
  accent = "mint",
}: StatCardProps) {
  const style = accentStyles[accent] || accentStyles.mint;

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-[var(--radius-lg)] p-3 sm:p-4 shadow-[var(--shadow-card)] hover:-translate-y-px transition-transform cursor-default`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">
          {label}
        </div>
      </div>
      <div
        className={`text-[22px] sm:text-[28px] font-bold tracking-tight mt-1 ${
          tinted ? style.icon : "text-[var(--color-label-primary)]"
        }`}
      >
        {value}
      </div>
      {delta && (
        <div
          className={`text-[11px] sm:text-[12px] font-medium mt-1 ${
            deltaType === "up" ? "text-[#34C759]" : "text-[var(--color-label-tertiary)]"
          }`}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
