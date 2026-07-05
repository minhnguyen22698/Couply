# Tiến độ triển khai — Couply

> File theo dõi tiến độ thực tế, đối chiếu với kế hoạch ở `implementation-plan-couply.md`. Cập nhật mỗi khi có thay đổi — đây là nguồn sự thật cho "đang ở đâu", còn file kia là spec/backlog.

## Trạng thái tổng quan

| Giai đoạn | Trạng thái |
|---|---|
| 0 — Chuẩn bị | **Hoàn tất** |
| 1 — Auth & nền tảng | **Hoàn tất** — Milestone 1 đạt (2026-07-05) |
| 2 — CRUD chi tiêu cá nhân | **Hoàn tất** — Milestone 2 đạt (2026-07-05) |
| 3 — Chụp ảnh hóa đơn | **Hoàn tất** — Milestone 3 đạt (2026-07-05) |
| 4 — Ghép cặp & chia sẻ | **Hoàn tất** — Milestone 4 đạt (2026-07-05) |
| 5 — Thông báo real-time | **Hoàn tất** — Milestone 5 đạt (2026-07-05) |
| 6 — Ngày/Tháng/Năm + Quỹ chung + Ngân sách | **Hoàn tất** — Milestone 6 đạt (2026-07-05) |
| 7 — Báo cáo & hoàn thiện | Code xong (trừ Web Push + polish UI sâu) — chờ bạn test tay |

---

## GIAI ĐOẠN 0 — Chuẩn bị

- [x] Repo Git + scaffold Next.js (TypeScript, Tailwind, App Router)
- [x] Project Supabase đã tạo, `.env.local` đã điền đầy đủ (2026-07-05)
- [x] Cài `@supabase/supabase-js` + `@supabase/ssr`
- [x] `src/lib/supabase/client.ts` + `src/lib/supabase/server.ts`
- [x] Design tokens Tailwind (`--a`, `--b`, `--gold`, `--ink`, `--paper`) trong `src/app/globals.css`
- [x] Kết nối Vercel với repo — auto build khi push (2026-07-05)

## GIAI ĐOẠN 1 — Auth & nền tảng

### 1.1 Google OAuth
- [x] Bật Google provider trong Supabase Dashboard → Authentication → Providers
- [x] Tạo OAuth Client ID trên Google Cloud Console, redirect URL `https://ymuyaimtkkodzgdvbqln.supabase.co/auth/v1/callback`
- [x] Trang `/login` — nút "Tiếp tục với Google" (`src/app/login/page.tsx`)
- [x] Route `/auth/callback` xử lý session (`src/app/auth/callback/route.ts`)
- [x] `src/proxy.ts` bảo vệ route chưa đăng nhập → redirect `/login` (lưu ý: Next.js 16 đổi `middleware.ts` → `proxy.ts`)

### 1.2 Bảng `profiles` + onboarding
- [x] Migration `supabase/migrations/20260704000001_profiles.sql` (bảng `profiles` + trigger tự tạo khi có user mới)
- [x] Apply migration lên project Supabase thật (`supabase link` + `supabase db push`, xác nhận bằng `supabase migration list`)
- [x] Trang onboarding: xác nhận tên hiển thị + chọn tiền tệ mặc định VND (`src/app/onboarding/`)

### 1.3 Layout khung mobile-first
- [x] `AppShell`: bottom nav (Tổng quan/Chúng ta/Báo cáo/Cài đặt) + FAB "+" (`src/components/app-shell.tsx`, `src/app/(app)/layout.tsx`)
- [x] Font Fraunces (display) / Inter (sans) / IBM Plex Mono (số tiền) áp trong `layout.tsx` + `globals.css`

**Milestone 1: ĐẠT (2026-07-05)** — đăng nhập Google thật hoạt động end-to-end: `/login` → Google → `/auth/callback` → `/onboarding` (điền tên + tiền tệ) → `/dashboard`. Xác nhận qua `supabase db query --linked`: profile được tạo bởi trigger, `onboarded` chuyển `true` sau khi submit form onboarding.

## GIAI ĐOẠN 2 — CRUD chi tiêu cá nhân

- [x] Migration `supabase/migrations/20260705000001_categories_and_expenses.sql`: bảng `categories` (7 danh mục mặc định seed qua trigger + backfill user cũ) + `expenses`
- [x] RLS `expenses`/`categories`: `user_id = auth.uid()` cho mọi thao tác
- [x] Bottom sheet "Thêm/Sửa chi tiêu" (`src/components/add-expense-sheet.tsx`): số tiền mono, pill chọn danh mục, ghi chú, ngày — mở qua FAB hoặc bấm vào 1 khoản chi để sửa
- [x] Server Actions: `createExpense`, `updateExpense`, `deleteExpense` (`src/app/(app)/expenses/actions.ts`)
- [x] Dashboard: tổng chi tháng hiện tại + "Gần đây" (10 khoản mới nhất) (`src/app/(app)/dashboard/page.tsx`)
- [x] Trang `/expenses`: danh sách đầy đủ, filter theo danh mục + khoảng ngày
- [x] Quản lý danh mục tại `/settings/categories`: thêm mới, xoá (danh mục mặc định không xoá được)
- [x] Migration đã push lên Supabase thật, xác nhận 7 danh mục mặc định + build/lint pass
- [x] **Đã test tay** (2026-07-05): thêm/sửa/xoá chi tiêu, tổng tháng và filter `/expenses` hoạt động đúng

**Milestone 2: ĐẠT (2026-07-05)**

## GIAI ĐOẠN 3 — Chụp ảnh hóa đơn

- [x] Migration `supabase/migrations/20260705000002_receipts_storage.sql`: cột `expenses.receipt_path` + bucket `receipts` (private) + Storage RLS theo path `{user_id}/...`
- [x] `browser-image-compression` — nén ảnh còn tối đa ~1000px trước khi upload
- [x] `PhotoCapture` (`src/components/photo-capture.tsx`): input camera/thư viện, upload thẳng từ client lên Storage, thumbnail qua signed URL, bấm ảnh để zoom full-screen
- [x] Gắn `PhotoCapture` vào bottom sheet thêm/sửa chi tiêu, lưu `receipt_path` qua `createExpense`/`updateExpense`
- [x] Xoá ảnh cũ trên Storage khi thay ảnh khác hoặc xoá khoản chi (`deleteExpense`, `updateExpense`)
- [x] Migration đã push lên Supabase thật, xác nhận bucket `receipts` (private) tồn tại; build/lint pass
- [x] **Đã test tay** (2026-07-05): thêm ảnh hoá đơn, xem thumbnail + zoom, thay ảnh khác và xoá khoản chi đều hoạt động đúng

**Milestone 3: ĐẠT (2026-07-05)**

## GIAI ĐOẠN 4 — Ghép cặp & chia sẻ

- [x] Migration `supabase/migrations/20260706000001_couples_and_sharing.sql`: bảng `couples` (chỉ có policy SELECT — mọi ghi đều qua RPC) + 3 hàm `security definer`: `create_invite()`, `join_couple(code)`, `leave_couple()`
- [x] Cột `visibility` ('private'|'shared'|'fund', mặc định 'private') + `couple_id` trên `expenses`
- [x] Viết lại RLS `expenses`: SELECT cho phép chính chủ hoặc partner (khi `visibility <> 'private'` và cùng `couple_id` với `status = 'active'`); INSERT/UPDATE/DELETE chỉ chính chủ
- [x] Policy `select_partner_profile` trên `profiles` để hiện tên partner ở tab Chúng ta
- [x] Server actions `src/app/(app)/together/actions.ts`: `createInvite`, `joinInvite`, `disconnectPartner`
- [x] `CoupleConnect` (`src/components/couple-connect.tsx`): sinh mã 6 số + copy, hoặc nhập mã để join
- [x] Trang `/together`: hiện `CoupleConnect` khi chưa ghép cặp, hiện `TogetherView` (2 cột tổng chi tháng này + thanh cân bằng + danh sách chi tiêu chia sẻ) khi đã ghép cặp active, nút "Ngắt kết nối"
- [x] Bottom sheet thêm/sửa chi tiêu: 3 nút Riêng tư/Chia sẻ/Quỹ chung (chỉ hiện khi đã có partner active) — `createExpense`/`updateExpense` tự tra `couple_id` phía server, ép về 'private' nếu client gửi lên mà không có partner active
- [x] Migration đã push lên Supabase thật; build/lint pass
- [x] **Đã test tay bằng 2 account thật** (2026-07-05): ghép cặp qua mã mời, chia sẻ/quỹ chung hiện đúng ở tab Chúng ta, khoản Riêng tư không lộ cho partner, ngắt kết nối và ghép lại đều ổn

**Milestone 4: ĐẠT (2026-07-05)**

## GIAI ĐOẠN 5 — Thông báo real-time

- [x] Migration `supabase/migrations/20260707000001_notifications.sql`: bảng `notifications` (user_id, type, payload jsonb, is_read) + RLS (select/update chỉ chính chủ, insert chỉ cho phép tạo notification cho partner active của mình) + thêm bảng vào publication `supabase_realtime`
- [x] `createExpense` tự tạo notification cho partner khi `visibility != 'private'` — không dùng trigger Postgres để toggle "Báo cho partner biết" ở form kiểm soát được việc này mà không cần thêm cột trên `expenses`
- [x] `RealtimeNotifications` (`src/components/realtime-notifications.tsx`): subscribe `postgres_changes` INSERT trên `notifications` filter theo `user_id`, hiện toast 4 giây + badge chuông (góc trên phải, mọi trang trong app)
- [x] Trang `/notifications`: danh sách lịch sử, tự đánh dấu đã đọc khi mở trang
- [x] Toggle "Báo cho partner biết" trong bottom sheet thêm chi tiêu (mặc định bật, chỉ hiện khi có partner active và đang tạo mới — không áp dụng khi sửa)
- [x] Migration đã push lên Supabase thật; build/lint pass
- [x] Sửa bug sau lần test đầu (2026-07-05): badge/toast không hiện — do subscribe Realtime trước khi JWT kịp gắn vào socket (race condition), đã sửa `getSession()` + `realtime.setAuth()` trước khi `.subscribe()`. Trang chậm — do các Server Component gọi Supabase tuần tự, đã gộp query độc lập chạy song song (`Promise.all`) ở layout + các trang chính. Tab "Chúng ta" không tự cập nhật — đã thêm `router.refresh()` mỗi khi có notification mới tới.
- [x] **Đã test lại và xác nhận ổn** (2026-07-05): toast/badge realtime hoạt động, tốc độ ổn, tab Chúng ta tự cập nhật
- [ ] Web Push (thông báo khi tắt app hẳn) — **chưa làm, đã quyết định để sau Giai đoạn 6** theo lựa chọn của bạn (2026-07-05). Cần: Service Worker + `manifest.json` (PWA), bảng `push_subscriptions`, VAPID keys, Edge Function gửi push. Lưu ý: iOS Safari chỉ nhận push nếu app được "Add to Home Screen" như PWA.

**Milestone 5: ĐẠT (2026-07-05)**

## GIAI ĐOẠN 6 — Ngày/Tháng/Năm + Quỹ chung + Ngân sách

- [x] `src/lib/period.ts` + `src/components/period-selector.tsx`: segmented control Ngày/Tháng/Năm dùng `searchParams` (`?period=&date=`), điều hướng lùi/tới bằng Link — không cần state client
- [x] Dashboard: tổng chi theo khoảng đã chọn (thay vì cố định tháng hiện tại); "Gần đây" vẫn là 10 khoản mới nhất tổng thể
- [x] Trang `/reports`: PeriodSelector + tổng chi + breakdown theo danh mục kèm % (chưa có chart — để Giai đoạn 7)
- [x] Migration `supabase/migrations/20260708000001_shared_fund.sql`: bảng `shared_funds` (1 quỹ/couple) + `fund_contributions`, RLS chỉ cho 2 người trong couple active. Số dư = tổng đóng góp − tổng expense có `visibility = 'fund'` của couple đó (nối liền khái niệm "Quỹ chung" đã có từ Giai đoạn 4)
- [x] `FundCard` (`src/components/fund-card.tsx`) trên tab Chúng ta: số dư, thanh progress theo mục tiêu, form đóng góp, lịch sử đóng góp từng người, đặt/sửa mục tiêu — quỹ được tự tạo (lazy) lần đầu couple mở tab Chúng ta
- [x] Migration `supabase/migrations/20260708000002_budgets.sql`: bảng `budgets` (user_id, category_id, month, amount) + RLS chính chủ
- [x] Trang `/settings/budgets`: đặt ngân sách theo danh mục cho từng tháng (điều hướng lùi/tới), thanh progress đổi màu khi ≥80%/≥100%
- [x] Banner cảnh báo trên Dashboard khi danh mục nào trong tháng hiện tại đạt ≥80% ngân sách
- [x] Migration đã push lên Supabase thật; build/lint pass
- [x] **Đã test tay** (2026-07-05): chuyển Ngày/Tháng/Năm ra đúng tổng, góp quỹ chung cộng đúng số dư, khoản chi Quỹ chung trừ đúng, cảnh báo ngân sách hiện đúng ở `/settings/budgets` và Dashboard

**Milestone 6: ĐẠT (2026-07-05)**

## GIAI ĐOẠN 7 — Báo cáo, biểu đồ & hoàn thiện

- [x] Cài `recharts`; áp dụng skill dataviz để chọn form/màu đúng trước khi code: breakdown theo danh mục là "so sánh độ lớn" → bar chart 1 màu (terracotta, `--a`) thay vì pie nhiều màu; so sánh 2 người là "phân biệt series" → grouped bar 2 màu cố định (`--a` = Bạn, `--b` = partner, đúng quy ước đã dùng từ Giai đoạn 4/6) kèm legend
- [x] `CategoryBarChart` (`src/components/category-bar-chart.tsx`) trên `/reports`: bar ngang theo danh mục cho khoảng thời gian đã chọn, giữ kèm danh sách text (số liệu chính xác, vai trò "table view" cho accessibility)
- [x] `CoupleComparisonChart` (`src/components/couple-comparison-chart.tsx`) trên `/reports`: so sánh chi tiêu chung 6 tháng gần đây giữa 2 người (chỉ hiện khi đã ghép cặp active)
- [x] Báo cáo tóm tắt cuối tháng trên `/reports`: tổng chi tháng này, tăng/giảm % so tháng trước, danh mục chi nhiều nhất
- [x] Settings: đổi tiền tệ (VND/USD) lưu vào `profiles.currency`; hiện trạng thái kết nối partner (chưa/đang chờ/đã kết nối) kèm link `/together`
- [x] Xuất CSV: route handler `/settings/export` tải file `.csv` toàn bộ chi tiêu (kèm BOM để Excel đọc đúng tiếng Việt có dấu)
- [x] PWA: `src/app/manifest.ts` + icon `192x192`/`512x512`/apple-touch-icon (placeholder màu terracotta — **cần thay bằng icon thiết kế thật khi có**), `themeColor` + `icons` trong `layout.tsx`
- [x] `src/app/(app)/loading.tsx`: skeleton loading dùng chung cho mọi trang trong app khi chuyển route; rà soát lại thấy các empty state (chưa có khoản chi/thông báo/đóng góp...) đã có sẵn từ các giai đoạn trước
- [x] Build/lint pass — không cần migration mới ở giai đoạn này
- [ ] **Chưa làm** (ngoài phạm vi đợt này theo quyết định 2026-07-05): Web Push khi tắt hẳn app, polish UI sâu (thay màu sắc/token placeholder bằng thiết kế thật, kiểm tra responsive kỹ trên nhiều thiết bị thật, xuất CSV theo bộ lọc/khoảng thời gian thay vì toàn bộ)
- [ ] **Bạn test tay**: mở `/reports` xem 2 chart hiện đúng số liệu, đổi tiền tệ ở Settings xem format tiền đổi theo đúng khắp app, bấm "Xuất CSV chi tiêu" xem file tải về mở bằng Excel đọc đúng dấu tiếng Việt, thử "Add to Home Screen" trên điện thoại xem cài được như app + icon hiện đúng màu terracotta

**Milestone 7 (MVP hoàn chỉnh):** Code sẵn sàng — chờ bạn xác nhận test tay để chốt milestone. Sau khi chốt, ứng dụng đã đủ tính năng theo kế hoạch gốc để mời 1–2 cặp đôi thật dùng thử (trừ Web Push và polish UI sâu, để làm sau khi có phản hồi người dùng thật).

---

## Việc cần bạn làm tiếp theo (ngoài khả năng tự động của mình)

1. Test tay Giai đoạn 7 (xem checklist ở trên): biểu đồ Báo cáo, đổi tiền tệ, xuất CSV, cài PWA lên điện thoại

## Bước tiếp theo trong roadmap

Toàn bộ roadmap gốc (Giai đoạn 0–7) đã code xong. Các việc còn lại ngoài phạm vi MVP ban đầu, làm sau khi có phản hồi người dùng thật: Web Push, polish UI/thiết kế thật thay placeholder, icon app thật thay bản đặt màu, xuất CSV có filter.
