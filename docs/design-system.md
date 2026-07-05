# Design system — Couply

> Nguồn sự thật cho UI/UX. Khi thêm màn hình/component mới, tra file này trước
> khi tự bịa class Tailwind mới — mục tiêu là đồng bộ tuyệt đối giữa các màn
> hình, không phải "tự do sáng tạo" mỗi trang một kiểu.

## Nguyên tắc mobile-first

- Thiết kế cho khung hình điện thoại trước (max-w màn hình ~390–430px), không
  cần breakpoint `md`/`lg` cho app (không phải marketing site) — mọi trang
  trong `(app)` chỉ render trên viewport hẹp.
- Mọi phần tử `fixed` neo vào cạnh màn hình (bottom nav, FAB, chuông thông
  báo, bottom sheet) **phải** cộng thêm `env(safe-area-inset-*)` để không bị
  tai thỏ / thanh home indicator che mất trên iPhone. `viewportFit: "cover"`
  đã bật trong `src/app/layout.tsx` để `env()` thực sự có giá trị.
- Vùng chạm tối thiểu **44×44px** cho mọi nút bấm/link chính (nút CTA, FAB,
  chuông, mũi tên prev/next). Text-link phụ (ví dụ "Xem tất cả") có thể nhỏ
  hơn vì không phải hành động chính.
- Luôn có empty state (`text-ink/40`) và không bao giờ để trắng trang khi
  chưa có dữ liệu.

## Màu sắc (`src/app/globals.css`)

| Token | Hex | Vai trò | Không dùng cho |
|---|---|---|---|
| `--ink` | `#211f1c` | Chữ chính, viền, nền tối (near-black warm gray) | — |
| `--paper` | `#faf6ef` | Nền toàn app | — |
| `--a` (terracotta) | `#c1633b` | **Brand/hành động chính** — nút CTA, tab active, "Bạn" trong biểu đồ/so sánh 2 người | Lỗi, cảnh báo (xem `--danger`/`--gold`) |
| `--b` (sage teal) | `#5f8575` | **Danh tính partner** — luôn gắn với "partner" trong so sánh 2 người (biểu đồ, thanh cân bằng Chúng ta) | Đừng dùng cho brand/CTA |
| `--gold` | `#c9a227` | **Cảnh báo** (ngân sách ≥80%) | Lỗi (dùng `--danger`) |
| `--danger` | `#c0392b` | **Lỗi form, vượt ngân sách (≥100%), hành động phá hủy** (xoá, ngắt kết nối) | Đừng tái dùng `--a` cho việc này — từng là lỗi thiết kế đã sửa |

Quy tắc: **màu accent (`--a`) không bao giờ đóng vai trò báo lỗi/cảnh báo.**
Đây là lỗi UX thật đã gặp (thông báo lỗi từng dùng `text-a` giống hệt màu nút
chính) — mọi lỗi/form validation dùng `text-danger`, cảnh báo ngưỡng dùng
`text-gold` (80%) rồi `text-danger` (100%+).

Biểu đồ Recharts không đọc được CSS custom properties trong SVG `fill` — dùng
`src/lib/palette.ts` (mirror thủ công của các token trên). Sửa màu ở
`globals.css` thì nhớ sửa luôn `palette.ts`.

## Typography

- **Display** (`--font-fraunces`, serif): tiêu đề trang (`<PageHeader>`), số
  tiền lớn không bắt buộc — chỉ dùng cho `<h1>`/tiêu đề.
- **Sans** (`--font-inter`): toàn bộ body text.
- **Mono** (`--font-plex-mono`): **mọi con số tiền**, không ngoại lệ — dùng
  qua `<AmountInput>` (nhập) hoặc class `font-[family-name:var(--font-mono)]`
  (hiển thị).
- Cỡ chữ: tiêu đề trang `text-2xl`, số tiền hero `text-3xl` (mono), số tiền
  phụ `text-2xl`/`text-xl` (mono), body mặc định, chú thích `text-sm`/`text-xs`.

## Độ trong suốt chữ/viền (thay vì bịa xám mới)

- Chữ chính: `text-ink` (100%)
- Chữ phụ: `text-ink/60`
- Chữ mờ/placeholder/empty-state: `text-ink/40`
- Viền hairline nhẹ (card): `border-ink/10`
- Viền rõ hơn (input, chip chưa chọn): `border-ink/15`

## Bo góc (radius scale)

| Cấp | Class | Dùng cho |
|---|---|---|
| Nhỏ | `rounded-xl` (12px) | input, select, chip/pill, nút `sm`/`md` |
| Vừa | `rounded-2xl` (16px) | Card, nút `lg` (CTA chính), AmountInput |
| Lớn | `rounded-3xl` (24px) | Bottom sheet (chỉ góc trên) |
| Tròn | `rounded-full` | FAB, icon button, badge, avatar |

## Component dùng chung (`src/components/ui/`)

Luôn ưu tiên các primitive này thay vì viết class tay lặp lại:

- **`<Card>`** — khung trắng bo góc 16px, viền `ink/10`, padding 20px. Mọi
  khối nội dung trên 1 trang (tổng chi, danh sách, form) đều là 1 `Card`.
- **`<PageHeader title="..." action={...} />`** — tiêu đề trang chuẩn (font
  Fraunces, `text-2xl`), có slot `action` bên phải nếu cần (nút, link).
- **`<Button variant size>`** — 3 variant: `primary` (CTA chính, nền `--a`),
  `outline` (viền, hành động phụ), `danger-outline` (xoá/ngắt kết nối). 3
  size: `lg` (CTA hero — login, submit form chính), `md` (mặc định, hầu hết
  nút inline), `sm` (nút gọn trong danh sách/hàng).
- **`<Input>` / `<Select>`** — input/select chuẩn, viền `ink/15`, bo `xl`.
- **`<AmountInput>`** — input tiền: mono, `text-2xl`, bo `2xl`, dùng ở MỌI
  form nhập số tiền (thêm chi tiêu, góp quỹ, đặt ngân sách/mục tiêu).
- **`<IconButton>` / `<IconLinkButton href>`** — nút tròn 36px cho mũi tên
  prev/next (PeriodSelector, điều hướng tháng ở Ngân sách).
- **`<ListRow href label value external>`** — hàng cài đặt full-width (label
  trái, giá trị + `›` phải), tối thiểu 48px cao. Dùng cho menu Cài đặt.

## Z-index (từ thấp đến cao)

| Lớp | z-index | Ghi chú |
|---|---|---|
| Bottom nav, FAB | `z-20` | Luôn hiện, không che nhau vì khác góc màn hình |
| Chuông + toast thông báo | `z-30` | Nổi trên nav/FAB |
| Bottom sheet thêm/sửa chi tiêu | `z-40` | Modal — phải nổi trên chuông |
| Ảnh hoá đơn phóng to (trong sheet) | `z-50` | Trên cùng |

## An toàn màn hình (safe-area) — checklist khi thêm phần tử `fixed` mới

1. Neo cạnh dưới? Thêm `pb-safe` hoặc `bottom-[calc(<offset>+env(safe-area-inset-bottom,0px))]`.
2. Neo cạnh trên? Thêm `pt-safe` hoặc `top-[calc(<offset>+env(safe-area-inset-top,0px))]`.
3. Có gây che nội dung cuộn bên dưới không? Nếu `<main>` cần padding bù, cập
   nhật `pb-28` trong `app-shell.tsx`.

## Trạng thái còn placeholder (chưa phải quyết định cuối)

- Icon app (`public/icon-*.png`, `apple-touch-icon.png`): hình vuông đặc màu
  terracotta — **thay bằng icon thiết kế thật khi có**.
- Web Push, polish thị giác sâu hơn (ảnh minh hoạ, illustration...): để
  Giai đoạn sau MVP theo quyết định 2026-07-05.
