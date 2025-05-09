import type { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function PageTitle({ title, description, icon }: PageTitleProps) {
  return (
    <div className="mb-8 text-center md:text-left">
      <div className="flex items-center justify-center md:justify-start gap-3">
        {icon && <div className="text-primary">{icon}</div>}
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
      </div>
      {description && (
        <p className="mt-2 text-lg text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
