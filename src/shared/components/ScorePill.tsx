export function ScorePill({ score }: { score: number }) {
  return <span className="score-pill">★ {score.toFixed(1)}</span>;
}
