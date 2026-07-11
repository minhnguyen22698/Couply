export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-10">
      <div className="h-7 w-24 animate-pulse rounded-lg bg-ink/10" />
      <div className="h-24 animate-pulse rounded-2xl bg-ink/10" />
      <div className="h-10 animate-pulse rounded-full bg-ink/10" />
      <div className="h-16 animate-pulse rounded-2xl bg-ink/10" />
      <div className="h-64 animate-pulse rounded-2xl bg-ink/10" />
    </div>
  );
}
