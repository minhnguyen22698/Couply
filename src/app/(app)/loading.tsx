export default function Loading() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-ink/10" />
      <div className="h-24 animate-pulse rounded-2xl bg-ink/10" />
      <div className="h-24 animate-pulse rounded-2xl bg-ink/10" />
    </div>
  );
}
