type TimelineItem = {
  title: string;
  description: string;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="space-y-5">
        {items.map((item, index) => (
          <div key={item.title} className="grid grid-cols-[2rem_1fr] gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              {index < items.length - 1 ? <div className="mt-2 h-full w-px bg-border" /> : null}
            </div>
            <div className="pb-5">
              <h3 className="font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
