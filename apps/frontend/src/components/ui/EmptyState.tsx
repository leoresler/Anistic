import { SearchX } from "lucide-react";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-anime-border bg-anime-surface/50 p-10 text-center sm:p-16">
    <div className="rounded-full bg-anime-input p-4 text-sabio-light">
      {icon ?? <SearchX size={32} />}
    </div>
    <h2 className="mt-5 text-2xl font-black tracking-tighter text-cream-primary">{title}</h2>
    {description ? <p className="mt-2 max-w-md font-semibold text-cream-secondary">{description}</p> : null}
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);
