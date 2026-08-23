import gbossLogoFull from "@/assets/gboss-logo-full.png";
import gbossIcon from "@/assets/gboss-icon.png";

/**
 * Logo G-Boss — utilisé sur fond sombre (sidebar navy) et fond clair (header,
 * pages publiques). Le PNG contient déjà le badge + le wordmark "G-BOSS",
 * donc un seul asset couvre les deux contextes.
 */
export function GBossLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <img src={gbossIcon} alt="G-Boss" className="h-9 w-auto shrink-0" />;
  }
  return <img src={gbossLogoFull} alt="G-Boss — Gérer. Organiser. Développer." className="h-16 w-auto shrink-0" />;
}

export function GBossLogoDark() {
  return <img src={gbossLogoFull} alt="G-Boss — Gérer. Organiser. Développer." className="h-14 w-auto shrink-0" />;
}

export function GBossIcon({ className = "h-9 w-9" }: { className?: string }) {
  return <img src={gbossIcon} alt="G-Boss" className={className} />;
}
