export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill accent-divider" style={{ width: `${value}%` }} />
    </div>
  );
}
