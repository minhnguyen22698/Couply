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

## Điều hướng giữa các tab — giữ dữ liệu cũ, không "load lại từ đầu"

Mọi trang trong `(app)` đều là Server Component động (đọc cookie phiên đăng
nhập Supabase), nên mặc định Next.js coi là "dynamic" và **luôn fetch lại từ
đầu** kể cả khi quay lại đúng tab vừa rời đi — đây là nguồn gốc cảm giác
"load lại mỗi lần chuyển tab" (phản hồi 2026-07-05). Đã xử lý bằng 2 cơ chế
kết hợp, không cần refactor sang Cache Components/PPR (rủi ro cao, gần như
toàn bộ dữ liệu ở đây vốn đã gắn với user cụ thể nên không cache chéo được):

1. **`next.config.ts` → `experimental.staleTimes.dynamic = 30`**: Router Cache
   phía client giữ lại bản render gần nhất của mỗi tab trong 30 giây — quay
   lại tab vừa xem trong khoảng đó thấy dữ liệu cũ ngay lập tức, không có
   khoảng trắng/skeleton. `router.refresh()` sau mọi mutation (thêm/sửa/xoá
   chi tiêu, ghép cặp, đóng góp quỹ...) vẫn bypass cache này nên dữ liệu bạn
   vừa thay đổi luôn đúng ngay khi quay lại trang đó.
2. **`.animate-page-in`** (`globals.css`) + `key={pathname}` trên `<main>`
   trong `app-shell.tsx`: mỗi khi chuyển sang route khác (không phải đổi query
   param trên cùng 1 trang, ví dụ bấm prev/next của PeriodSelector), nội dung
   fade-in nhẹ thay vì đập vào mắt đột ngột — dù dữ liệu đến từ cache (tức
   thì) hay phải fetch mới (sau khi `loading.tsx` hiện skeleton một chút).

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

**Màu categorical cho chart nhiều lát (pie/donut, ≥3 series):** dùng
`categoricalPalette` (8 màu, thứ tự cố định) trong `palette.ts` — đây là bộ màu
mặc định đã validate qua `dataviz` skill (`scripts/validate_palette.js`) đối
với nền `--paper`, **không phải** `--a`/`--b`/`--gold` (những màu đó giữ vai
trò ngữ nghĩa riêng, không dùng làm identity chung chung cho category). Luôn
giữ đúng thứ tự mảng — đây là cơ chế an toàn cho người mù màu, xáo lại thứ tự
là phá hỏng nó. Quá 8 danh mục thì gộp phần dư vào "Khác"
(`foldTopCategories` trong `category-pie-chart.tsx`).

**Gotcha Recharts đã gặp thật:** `<Pie label={fn}>` chỉ render label sau khi
animation nhập cảnh xong (`showLabels: !isAnimating` trong source Recharts) —
trong môi trường test/build tự động, animation có thể không bao giờ báo
"xong", khiến label % không hiện dù DOM/màu vẫn đúng. Đã set
`isAnimationActive={false}` trên `<Pie>` để label luôn hiện ngay — không chỉ
là workaround cho việc verify, mà còn là UX tốt hơn cho 1 chart nhỏ trong báo
cáo tài chính (không cần hiệu ứng xoay 1.9s mỗi lần xem trang).

## Typography

- **Display** (`--font-fraunces`, serif): tiêu đề trang (`<PageHeader>`), số
  tiền lớn không bắt buộc — chỉ dùng cho `<h1>`/tiêu đề.
- **Sans** (`--font-inter`): toàn bộ body text.
- **Money** (`--font-money` = Sora, gán vào token `--font-mono`): **mọi con số
  tiền**, không ngoại lệ — dùng qua `<AmountInput>` (nhập) hoặc class
  `font-[family-name:var(--font-mono)] tabular-nums` (hiển thị). Đổi từ IBM
  Plex Mono sang Sora (2026-07-05) theo yêu cầu "font tiền mềm mại hơn" — Sora
  không phải monospace thật nên **luôn kèm `tabular-nums`** để số thẳng cột
  trong danh sách/bảng.
- Cỡ chữ: tiêu đề trang `text-2xl`, số tiền hero `text-3xl` (mono), số tiền
  phụ `text-2xl`/`text-xl` (mono), body mặc định, chú thích `text-sm`/`text-xs`.

## Nhập số tiền — format theo locale

`<AmountInput currency size>` (trong `src/components/ui/input.tsx`) tự động
format số hiển thị theo `Intl`-locale của currency (VD: VND → `vi-VN` →
`1.500.000` dùng dấu chấm phân cách nghìn; USD → `en-US` → dấu phẩy) trong lúc
gõ, nhưng gửi lên server một input ẩn cùng `name` chỉ chứa chuỗi số thuần —
server action không cần biết gì về locale. **Luôn truyền `currency` prop** —
thiếu nó sẽ mặc định VND. Có 2 size: `lg` (form thêm chi tiêu — ô to, nổi bật)
và `sm` (form phụ như góp quỹ, đặt ngân sách/mục tiêu, đặt giá trị nhanh).

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
- **`<AmountInput currency size>`** — input tiền tự format theo locale (xem
  mục "Nhập số tiền" ở trên), dùng ở MỌI form nhập số tiền (thêm chi tiêu, góp
  quỹ, đặt ngân sách/mục tiêu).
- **`<IconButton>` / `<IconLinkButton href>`** — nút tròn 36px cho mũi tên
  prev/next (PeriodSelector, điều hướng tháng ở Ngân sách).
- **`<ListRow href label value external>`** — hàng cài đặt full-width (label
  trái, giá trị + `›` phải), tối thiểu 48px cao. Dùng cho menu Cài đặt.

## Icon (`lucide-react`)

Bottom nav (`app-shell.tsx`) và các icon hệ thống khác (chuông thông báo) dùng
`lucide-react` — không dùng emoji cho icon điều hướng/chức năng (emoji chỉ hợp
cho nội dung do người dùng chọn, ví dụ icon danh mục 🍜🚗 hay ảnh hoá đơn 📷).
Icon size chuẩn cho bottom nav: `20px`, `strokeWidth` đổi theo trạng thái active
(`2.25` active / `1.75` inactive) để nhấn mạnh tab đang chọn mà không cần đổi
size.

## Bottom nav — nút "+" gắn liền giữa thanh

FAB không còn là nút nổi rời góc phải — nó nằm giữa 4 tab (2 trái, 2 phải),
nổi lên trên đường viền thanh nav bằng `relative -top-5` (không dùng
`position: fixed` riêng, không cần z-index riêng vì DOM order tự vẽ đè lên
viền). Thứ tự tab trái→phải: Tổng quan, Chúng ta, **[+]**, Báo cáo, Cài đặt.

## Tab "Chúng ta" — màu theo người sở hữu

Mỗi dòng chi tiêu chia sẻ có viền trái 4px + tên người + số tiền cùng màu:
`--a` nếu là mình, `--b` nếu là partner — dùng `border-l-4 border-l-a`/
`border-l-b` (không dùng `border-l-{color}` chung với `border-color` không
hướng, dễ dính màu chéo sang viền dưới). Đồng bộ với màu trong thanh cân bằng
phía trên và biểu đồ so sánh 6 tháng ở Báo cáo — 3 chỗ này phải luôn cùng quy
ước màu.

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
