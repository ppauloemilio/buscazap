interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b bg-muted/20 px-4 py-10">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
