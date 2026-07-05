import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "@/app/(app)/categories/actions";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <PageHeader title="Danh mục" />

      <Card className="p-0">
        {(categories ?? []).map((category) => (
          <div
            key={category.id}
            className="flex min-h-12 items-center justify-between border-b border-ink/10 px-4 py-2 last:border-0"
          >
            <span className="flex items-center gap-2">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </span>
            {!category.is_default && (
              <form action={deleteCategory.bind(null, category.id)}>
                <Button type="submit" variant="danger-outline" size="sm">
                  Xoá
                </Button>
              </form>
            )}
          </div>
        ))}
      </Card>

      <form
        action={createCategory}
        className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-5"
      >
        <p className="text-sm text-ink/60">Thêm danh mục mới</p>
        <div className="flex gap-2">
          <Input
            name="icon"
            placeholder="🏷️"
            maxLength={2}
            className="w-16 text-center"
          />
          <Input name="name" placeholder="Tên danh mục" required />
        </div>
        {error && (
          <p className="text-sm text-danger">Có lỗi xảy ra, thử lại.</p>
        )}
        <Button type="submit" className="w-fit">
          Thêm
        </Button>
      </form>
    </div>
  );
}
