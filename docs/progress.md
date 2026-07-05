# Tiến độ triển khai — Couply

> File theo dõi tiến độ thực tế, đối chiếu với kế hoạch ở `implementation-plan-couply.md`. Cập nhật mỗi khi có thay đổi — đây là nguồn sự thật cho "đang ở đâu", còn file kia là spec/backlog.

## Trạng thái tổng quan

| Giai đoạn | Trạng thái |
|---|---|
| 0 — Chuẩn bị | **Hoàn tất** |
| 1 — Auth & nền tảng | **Hoàn tất** — Milestone 1 đạt (2026-07-05) |
| 2 — CRUD chi tiêu cá nhân | Code xong, đã push migration — chờ bạn test tay |
| 3 — Chụp ảnh hóa đơn | Code xong, đã push migration — chờ bạn test tay |
| 4 — Ghép cặp & chia sẻ | Code xong, đã push migration — chờ bạn test tay |
| 5 — Thông báo real-time | Code xong, đã push migration — chờ bạn test tay |
| 6 — Ngày/Tháng/Năm + Quỹ chung | Chưa bắt đầu |
| 7 — Báo cáo & hoàn thiện | Chưa bắt đầu |

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
- [ ] **Bạn test tay**: thêm ảnh hoá đơn vào 1 khoản chi, xem lại thumbnail + zoom, thử thay ảnh khác và xoá khoản chi để chắc file dọn theo

**Milestone 3:** Code sẵn sàng — chờ bạn xác nhận test tay để chốt milestone.

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
- [ ] **Bạn test tay bằng 2 account thật**: ghép cặp qua mã mời, thêm khoản chi ở mức Chia sẻ/Quỹ chung từ account A → xác nhận account B thấy ở tab Chúng ta; thêm khoản Riêng tư → xác nhận account B KHÔNG thấy (đây là phần quan trọng nhất, cần test kỹ RLS); thử "Ngắt kết nối" rồi ghép lại

**Milestone 4:** Code sẵn sàng — chờ bạn xác nhận test tay với 2 account để chốt milestone.

## GIAI ĐOẠN 5 — Thông báo real-time

- [x] Migration `supabase/migrations/20260707000001_notifications.sql`: bảng `notifications` (user_id, type, payload jsonb, is_read) + RLS (select/update chỉ chính chủ, insert chỉ cho phép tạo notification cho partner active của mình) + thêm bảng vào publication `supabase_realtime`
- [x] `createExpense` tự tạo notification cho partner khi `visibility != 'private'` — không dùng trigger Postgres để toggle "Báo cho partner biết" ở form kiểm soát được việc này mà không cần thêm cột trên `expenses`
- [x] `RealtimeNotifications` (`src/components/realtime-notifications.tsx`): subscribe `postgres_changes` INSERT trên `notifications` filter theo `user_id`, hiện toast 4 giây + badge chuông (góc trên phải, mọi trang trong app)
- [x] Trang `/notifications`: danh sách lịch sử, tự đánh dấu đã đọc khi mở trang
- [x] Toggle "Báo cho partner biết" trong bottom sheet thêm chi tiêu (mặc định bật, chỉ hiện khi có partner active và đang tạo mới — không áp dụng khi sửa)
- [x] Migration đã push lên Supabase thật; build/lint pass
- [ ] **Bạn test tay bằng 2 account thật**: mở app ở cả 2 máy/tab, account A thêm khoản chi Chia sẻ/Quỹ chung → xác nhận account B nhận toast + badge tăng gần như ngay lập tức khi đang mở app; tắt toggle "Báo cho partner biết" → xác nhận không có thông báo nhưng khoản chi vẫn hiện ở tab Chúng ta; mở `/notifications` → xác nhận badge về 0

**Milestone 5:** Code sẵn sàng — chờ bạn xác nhận test tay để chốt milestone.

## GIAI ĐOẠN 6–7

Chưa bắt đầu. Xem chi tiết từng việc ở `implementation-plan-couply.md`.

---

## Việc cần bạn làm tiếp theo (ngoài khả năng tự động của mình)

1. Test tay Giai đoạn 4 bằng 2 account thật (xem checklist ở trên) — đặc biệt xác nhận khoản "Riêng tư" không lộ cho partner
2. Test tay Giai đoạn 5 bằng 2 account thật (xem checklist ở trên)

## Bước tiếp theo trong roadmap

Giai đoạn 6 — Xem theo Ngày/Tháng/Năm + Quỹ chung: segmented control chuyển khoảng thời gian, bảng `shared_fund`/`fund_contributions`, bảng `budgets` với cảnh báo 80%/100%.

Ghi chú: bạn có nhắc UI hiện còn xấu — theo kế hoạch, việc làm đẹp giao diện (màu sắc/token thật thay placeholder, spacing, polish component) được xếp vào Giai đoạn 7 sau khi đủ tính năng. Nếu muốn ưu tiên sớm hơn thì báo mình.
