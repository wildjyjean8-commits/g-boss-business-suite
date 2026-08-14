export function GBossLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-[#00113c]"
        style={{ backgroundImage: "var(--gradient-gold)" }}
        aria-hidden
      >
        G
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block font-display text-base font-bold tracking-tight text-white">
            G-BOSS
          </span>
          <span className="block text-[10px] font-medium text-gold">
            Gérer. Organiser. Développer.
          </span>
        </span>
      )}
    </div>
  );
}

export function GBossLogoDark() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-xl font-bold text-[#00113c]"
        style={{ backgroundImage: "var(--gradient-gold)" }}
        aria-hidden
      >
        G
      </span>
      <span className="leading-tight">
        <span className="gb-gradient-text block font-display text-lg font-bold tracking-tight">
          G-BOSS
        </span>
        <span className="block text-[10px] font-medium text-muted-foreground">
          Gérer. Organiser. Développer.
        </span>
      </span>
    </div>
  );
}
