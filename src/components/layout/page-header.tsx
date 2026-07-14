interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly compact?: boolean;
}

export function PageHeader({ title, description, compact = false }: PageHeaderProps) {
  return (
    <div
      className={
        compact
          ? "border-b bg-muted/20 px-4 py-5"
          : "border-b bg-muted/20 px-4 py-10"
      }
    >
      <div className="container mx-auto max-w-4xl">
        <h1
          className={
            compact
              ? "text-xl font-bold text-foreground md:text-2xl"
              : "text-2xl font-bold text-foreground md:text-3xl"
          }
        >
          {title}
        </h1>
        {description && (
          <p
            className={
              compact
                ? "mt-1 text-sm text-muted-foreground"
                : "mt-2 text-sm text-muted-foreground md:text-base"
            }
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
