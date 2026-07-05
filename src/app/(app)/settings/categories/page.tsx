import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "@/app/(app)/categories/actions";

export default async function CategoriesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon, is_default")
    .eq("user_id", user!.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-4 px-5 pt-10">
      <Link href="/settings" className="text-sm text-ink/60">
        ← Cài đặt
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Danh mục
      </h1>

      <div className="rounded-2xl border border-ink/10 bg-white p-5">
        {(categories ?? []).map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between border-b border-ink/10 py-2 last:border-0"
          >
            <span className="flex items-center gap-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </span>
            {!category.is_default && (
              <form action={deleteCategory.bind(null, category.id)}>
                <button type="submit" className="text-sm text-ink/40">
                  Xoá
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <form
        action={createCategory}
        className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5"
      >
        <p className="text-sm text-ink/60">Thêm danh mục mới</p>
        <div className="flex gap-2">
          <input
            name="icon"
            placeholder="🏷️"
            maxLength={2}
            className="w-16 rounded-xl border border-ink/15 px-3 py-2 text-center"
          />
          <input
            name="name"
            placeholder="Tên danh mục"
            required
            className="flex-1 rounded-xl border border-ink/15 px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-a">Có lỗi xảy ra, thử lại.</p>}
        <button
          type="submit"
          className="rounded-xl bg-a px-4 py-2 text-sm text-paper"
        >
          Thêm
        </button>
      </form>
    </div>
  );
}
