type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {subtitle ? <p className="text-sm font-black uppercase tracking-[0.32em] text-sabio-light">{subtitle}</p> : null}
      <h1 className="mt-2 text-4xl font-black tracking-tighter text-cream-primary sm:text-5xl">{title}</h1>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </header>
);
