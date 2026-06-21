type AiConfidenceBarProps = {
  score: number;
};

export const AiConfidenceBar = ({ score }: AiConfidenceBarProps) => {
  const safeScore = Math.max(0, Math.min(1, score));
  const percent = Math.round(safeScore * 100);
  const label = safeScore >= 0.9 ? "Match perfecto" : safeScore >= 0.75 ? "Muy similar" : safeScore >= 0.5 ? "Similar" : "Coincidencia leve";
  const color = safeScore >= 0.9 ? "bg-sabio" : safeScore >= 0.75 ? "bg-amber-400" : safeScore >= 0.5 ? "bg-orange-400" : "bg-white/30";

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em]">
        <span className="text-cream-secondary">{label}</span>
        <span className="text-sabio-light">{percent}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-anime-main">
        <div className={`h-full rounded-full ${color} transition-[width] duration-600 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
