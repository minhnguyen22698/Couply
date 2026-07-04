# Kế hoạch triển khai chi tiết — Couply

> File này chia nhỏ roadmap thành các step cụ thể, có thể checklist dần. Đặt trong `C:\things\Projects\Couply\implementation-plan-couply.md`.

---

## GIAI ĐOẠN 0 — Chuẩn bị (0.5–1 ngày)

- [ ] Tạo repo Git (`couply`), khởi tạo Next.js: `npx create-next-app@latest couply --typescript --tailwind --app`
- [ ] Tạo project trên [supabase.com](https://supabase.com) → lấy `Project URL` + `anon key`
- [ ] Cài SDK: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] Tạo file `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```
- [ ] Tạo `lib/supabase/client.ts` và `lib/supabase/server.ts` (client cho browser và server component)
- [ ] Cấu hình Tailwind theme: khai báo màu `--a` (terracotta), `--b` (sage teal), `--gold`, `--ink`, `--paper` trong `tailwind.config.ts`
- [ ] Kết nối Vercel với repo (deploy preview tự động mỗi PR)

---

## GIAI ĐOẠN 1 — Auth & nền tảng (2–3 ngày)

### 1.1 Google OAuth
- [ ] Vào Supabase Dashboard → Authentication → Providers → bật **Google**
- [ ] Tạo OAuth Client ID trên Google Cloud Console, thêm redirect URL: `https://<project>.supabase.co/auth/v1/callback`
- [ ] Dán Client ID/Secret vào Supabase
- [ ] Code trang `/login`: nút "Tiếp tục với Google" gọi `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] Tạo route `/auth/callback` xử lý session sau khi Google redirect về
- [ ] Middleware bảo vệ route: chưa đăng nhập → redirect `/login`

### 1.2 Bảng `profiles` + onboarding
- [ ] Tạo bảng `profiles` (id, display_name, avatar_url, currency, created_at)
- [ ] Trigger Postgres: khi có user mới trong `auth.users` → tự tạo row `profiles` tương ứng
- [ ] Trang onboarding: xác nhận tên hiển thị (lấy từ Google), chọn tiền tệ (mặc định VND)

### 1.3 Layout khung mobile-first
- [ ] Dựng `AppShell`: bottom nav (Tổng quan / Chúng ta / Báo cáo / Cài đặt) + nút FAB "+"
- [ ] Áp token thiết kế đã chốt ở mockup (font Fraunces/Inter/IBM Plex Mono, bo góc 14–20px, card nền `--paper`)

**Milestone 1:** Đăng nhập Google thành công, vào được Dashboard trống.

---

## GIAI ĐOẠN 2 — CRUD chi tiêu cá nhân (3–4 ngày)

- [ ] Tạo bảng `categories` (seed 7 danh mục mặc định qua migration) + `expenses`
- [ ] Viết RLS cho `expenses`: `user_id = auth.uid()` cho SELECT/INSERT/UPDATE/DELETE (chưa xử lý partner ở bước này)
- [ ] Form "Thêm chi tiêu" (bottom sheet): input số tiền dạng mono, chọn danh mục (pill scroll ngang), ghi chú
- [ ] API/Server Action: `createExpense()`, `updateExpense()`, `deleteExpense()`
- [ ] Dashboard: hiển thị tổng chi tháng hiện tại + danh sách "Gần đây" (query `expenses` where `user_id = me` order by date desc limit 10)
- [ ] Trang danh sách đầy đủ: filter theo danh mục, khoảng ngày
- [ ] Quản lý danh mục tuỳ chỉnh (CRUD `categories` where `user_id = me`)

**Milestone 2:** Một người dùng tự thêm/sửa/xoá chi tiêu, thấy tổng chi tháng chính xác.

---

## GIAI ĐOẠN 3 — Chụp ảnh hóa đơn (1–2 ngày)

- [ ] Tạo bucket Supabase Storage `receipts` (private, truy cập qua signed URL)
- [ ] Viết Storage policy: user chỉ upload/đọc file trong path `receipts/{user_id}/...`
- [ ] Component `<PhotoCapture>`: `<input type="file" accept="image/*" capture="environment">` cho mobile, hoặc chọn ảnh thư viện
- [ ] Nén ảnh phía client trước upload (dùng `browser-image-compression`, resize ~800–1000px)
- [ ] Upload lên Storage → lưu `receipt_path` vào `expenses`
- [ ] Hiển thị thumbnail trong sheet thêm chi tiêu + xem full ảnh (modal/zoom) trong chi tiết giao dịch
- [ ] Xử lý xoá ảnh khi xoá khoản chi (cleanup Storage)

**Milestone 3:** Thêm được ảnh hóa đơn vào một khoản chi và xem lại được.

---

## GIAI ĐOẠN 4 — Ghép cặp & chia sẻ với partner (3–4 ngày)

- [ ] Tạo bảng `couples` (user_a_id, user_b_id, invite_code, status)
- [ ] Trang "Kết nối partner": sinh mã mời 6 số ngẫu nhiên, hiển thị + copy/share link
- [ ] Trang nhập mã: partner nhập mã → tạo/join `couples`, set `status = active`
- [ ] Thêm cột `visibility` ('private' | 'shared' | 'fund') và `couple_id` vào `expenses`
- [ ] **Viết lại RLS `expenses`** (quan trọng nhất):
  ```sql
  -- SELECT: chính chủ, hoặc partner khi visibility != 'private' và cùng couple active
  create policy "select_own_or_shared"
  on expenses for select
  using (
    user_id = auth.uid()
    or (
      visibility <> 'private'
      and couple_id in (
        select id from couples
        where status = 'active'
        and (user_a_id = auth.uid() or user_b_id = auth.uid())
      )
    )
  );
  ```
- [ ] Test kỹ RLS bằng 2 account thật: đảm bảo khoản "Riêng tư" KHÔNG lộ cho partner
- [ ] UI: bottom sheet thêm chi tiêu → chọn mức chia sẻ (3 nút Riêng tư/Chia sẻ/Quỹ chung)
- [ ] Tab "Chúng ta": query song song chi tiêu của cả 2 theo `couple_id`, hiển thị 2 cột + thanh cân bằng (balance bar)
- [ ] Tính năng "Ngắt kết nối partner": set `status = 'inactive'`, giữ lại lịch sử nhưng ẩn khỏi tab Chúng ta

**Milestone 4:** Hai account ghép cặp thành công, thấy chi tiêu chia sẻ của nhau, khoản riêng tư không lộ.

---

## GIAI ĐOẠN 5 — Thông báo real-time cho partner (2–3 ngày)

- [ ] Tạo bảng `notifications` (user_id, type, payload jsonb, is_read, created_at)
- [ ] Trigger Postgres: sau khi INSERT `expenses` với `visibility != 'private'` → tự tạo row `notifications` cho partner
- [ ] Client subscribe **Supabase Realtime** trên bảng `notifications` filter theo `user_id = auth.uid()`
- [ ] Khi có event mới và app đang mở → hiện toast trong app ("🔔 Khang vừa thêm khoản chi...")
- [ ] Trang "Thông báo": list lịch sử, đánh dấu đã đọc khi mở
- [ ] Toggle "Báo cho [partner] biết" trong form thêm chi tiêu — nếu tắt, bỏ qua bước tạo notification (chỉ áp dụng phía UI, còn dữ liệu vẫn theo `visibility`)
- [ ] (Nâng cao — có thể để phase sau) Web Push: đăng ký Service Worker, lưu subscription vào bảng `push_subscriptions`, dùng Edge Function gửi push khi user không mở app

**Milestone 5:** Thêm khoản chi chia sẻ ở account A → account B nhận thông báo gần như ngay lập tức khi đang mở app.

---

## GIAI ĐOẠN 6 — Xem theo Ngày/Tháng/Năm + Quỹ chung (3–4 ngày)

- [ ] Segmented control "Ngày / Tháng / Năm" ở Dashboard và trang Báo cáo
- [ ] Query tổng hợp theo khoảng đã chọn (dùng `date >= start and date < end`), có thể tạo Postgres view `expense_daily_summary` / `expense_monthly_summary` để tính sẵn tổng theo danh mục, tối ưu tốc độ
- [ ] Điều hướng lùi/tới giữa các khoảng thời gian (nút mũi tên trái/phải quanh label ngày/tháng/năm)
- [ ] Tạo bảng `shared_fund` + `fund_contributions`
- [ ] UI Quỹ chung: card mục tiêu (thanh progress + số dư), form đóng góp, lịch sử đóng góp từng người
- [ ] Bảng `budgets`: đặt ngân sách theo danh mục/tháng, cảnh báo khi đạt 80% và 100%

**Milestone 6:** Xem được chi tiêu theo 3 khoảng thời gian, có quỹ chung hoạt động với mục tiêu tiết kiệm.

---

## GIAI ĐOẠN 7 — Báo cáo, biểu đồ & hoàn thiện (3–4 ngày)

- [ ] Trang Báo cáo: biểu đồ cột/tròn theo danh mục (Recharts), biểu đồ so sánh 2 người theo thời gian
- [ ] Báo cáo tóm tắt cuối tháng (trong app, có thể email sau)
- [ ] Cài đặt: đổi tiền tệ, quản lý danh mục, quản lý kết nối partner, xuất CSV
- [ ] PWA: thêm `manifest.json`, icon, kiểm tra installable trên mobile
- [ ] Kiểm tra responsive toàn bộ, empty states, loading states
- [ ] Test toàn luồng với 2 tài khoản thật trước khi mời người dùng đầu tiên

**Milestone 7 (MVP hoàn chỉnh):** Sẵn sàng để 1–2 cặp đôi thật dùng thử.

---

## Tổng thời gian ước tính
~18–24 ngày làm việc (làm một mình, part-time có thể x2–x3 thời gian này).

## Thứ tự ưu tiên nếu cần rút gọn MVP
1. Auth + CRUD cá nhân (Giai đoạn 1–2) — bắt buộc
2. Ghép cặp + chia sẻ + RLS (Giai đoạn 4) — đây là giá trị cốt lõi, không thể bỏ
3. Chụp ảnh hóa đơn (Giai đoạn 3) — có thể làm sau nếu cần ra bản demo nhanh
4. Thông báo real-time (Giai đoạn 5) — có thể tạm thay bằng "refresh thủ công" ở bản đầu
5. Ngày/Tháng/Năm + Quỹ chung (Giai đoạn 6), Báo cáo (Giai đoạn 7) — làm sau khi có người dùng thật phản hồi
