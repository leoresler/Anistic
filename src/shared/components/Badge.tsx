import type { AnimeStatus } from '../mocks/animeData';

const badgeStyles: Record<AnimeStatus, string> = {
  airing: 'status-badge-airing',
  completed: 'status-badge-completed',
  plan: 'status-badge-plan',
  dropped: 'status-badge-dropped',
  movie: 'status-badge-movie',
};

export function Badge({ status }: { status: AnimeStatus }) {
  return (
    <span className={`status-badge ${badgeStyles[status]}`}>
      <span className={`h-[5px] w-[5px] rounded-full ${status === 'airing' ? 'animate-pulse bg-current' : 'bg-current'}`} />
      {status}
    </span>
  );
}
