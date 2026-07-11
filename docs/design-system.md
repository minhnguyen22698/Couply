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
   Đã tăng lên 0.45s / trượt 16px + scale nhẹ (2026-07-05) vì bản đầu (0.25s/
   4px) quá nhẹ để nhận ra.

## Bug đã gặp thật: `AmountInput` nhân đôi số khi có IME (Unikey/EVKey)

**Triệu chứng (2026-07-05):** gõ "30000" trong `AmountInput` ra "330000" —
chỉ xảy ra với người dùng có bật công cụ gõ tiếng Việt kiểu Unikey/EVKey
(hook bàn phím ở tầng OS). Log debug cho thấy `KeyboardEvent.key === "Process"`
— dấu hiệu IME/hook bàn phím đang xử lý phím thay vì gửi thẳng.

**Nguyên nhân:** bản đầu format lại `value` (chèn dấu `.` phân cách nghìn)
ngay trong lúc gõ, mỗi lần format làm đổi ĐỘ DÀI chuỗi (`"4000"` → `"4.000"`).
Trình duyệt mặc định đẩy con trỏ ra CUỐI chuỗi mỗi khi giá trị bị ghi đè bằng
JS — khi vị trí con trỏ không còn khớp với những gì IME (Unikey/EVKey) đang
mong đợi giữa lúc xử lý phím, IME phát lại (replay) ký tự vừa gõ, gây nhân đôi
("4000" gõ thêm "0" thành "440000" thay vì "40000").

**Cách sửa (2026-07-05, bản 2):** vẫn hiện số đã format **ngay cả khi đang gõ**
(theo yêu cầu — không chuyển sang "raw lúc gõ, format lúc blur" như bản đầu),
nhưng sau mỗi lần format, **chủ động khôi phục vị trí con trỏ** bằng cách đếm
số chữ số đứng trước con trỏ trong giá trị vừa gõ, rồi đặt lại con trỏ ở đúng
vị trí tương ứng trong chuỗi đã format (`countDigitsBefore` /
`caretForDigitCount` trong `input.tsx`, chạy qua `useLayoutEffect`) — thay vì
để trình duyệt tự đẩy con trỏ ra cuối. Đã verify bằng Playwright: gõ tuần tự
đúng kết quả, và chèn số vào GIỮA chuỗi đã format cũng giữ đúng vị trí con trỏ.

**Rủi ro còn lại:** đây là kỹ thuật chuẩn cho input tiền có live-format (các
thư viện như `react-number-format` dùng cách tương tự), nhưng môi trường dev
không mô phỏng được IME Unikey/EVKey thật — nếu vẫn còn gặp lỗi nhân đôi số ở
người dùng có bật IME, hướng dự phòng là quay lại bản 1 (số thô lúc focus,
format lúc blur — an toàn tuyệt đối, chỉ đánh đổi việc không thấy dấu phân
cách trong lúc gõ).

## Màu sắc (`src/app/globals.css`)

| Token | Hex | Vai trò | Không dùng cho |
|---|---|---|---|
| `--ink` | `#1b2422` | Chữ chính, viền, nền tối (near-black cool gray) | — |
| `--paper` | `#f3faf8` | Nền toàn app | — |
| `--a` (ocean blue) | `#1868db` | **Brand/hành động chính** — nút CTA, tab active, "Bạn" trong biểu đồ/so sánh 2 người | Lỗi, cảnh báo (xem `--danger`/`--gold`) |
| `--b` (emerald green) | `#0b7a50` | **Danh tính partner** — luôn gắn với "partner" trong so sánh 2 người (biểu đồ, thanh cân bằng Chúng ta) | Đừng dùng cho brand/CTA |
| `--gold` | `#c9a227` | **Cảnh báo** (ngân sách ≥80%) | Lỗi (dùng `--danger`) |
| `--danger` | `#c0392b` | **Lỗi form, vượt ngân sách (≥100%), hành động phá hủy** (xoá, ngắt kết nối) | Đừng tái dùng `--a` cho việc này — từng là lỗi thiết kế đã sửa |

> Đổi từ bảng màu đất nung/sage (terracotta/sage) sang "tươi xanh" (ocean
> blue/emerald) theo yêu cầu 2026-07-11 — cả hai tông đều đạt ≥4.5:1 trên nền
> `--paper` mới (kiểm tra thủ công qua công thức WCAG relative luminance), giữ
> nguyên vai trò ngữ nghĩa `--a`=mình/`--b`=partner, chỉ đổi hex. `--gold`/
> `--danger` giữ nguyên vì đây là màu chức năng (cảnh báo/lỗi), không thuộc
> phạm vi đổi màu brand.

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

## Loading & lỗi cho hành động cần chờ (2026-07-11)

Phản hồi: các nút ở bottom nav và nút hành động (xoá, ngắt kết nối, đăng
xuất...) mỗi nơi loading khác nhau, có nơi bấm xong không thấy gì và lỗi thì
im lặng — sửa bằng 2 cơ chế dùng chung, không để mỗi component tự bịa kiểu
riêng:

1. **Chuyển tab bottom nav**: mỗi route trong `(app)` (trừ layout gốc đã có
   `(app)/loading.tsx`) có `loading.tsx` riêng (`dashboard/`, `together/`,
   `reports/`, `settings/`) — cùng kiểu skeleton `animate-pulse bg-ink/10`.
   Next.js prefetch xuống tới boundary này nên chuyển tab luôn thấy skeleton
   ngay, không còn tab nào "đứng hình" chờ dữ liệu trong im lặng chỉ vì
   30s router cache (`staleTimes.dynamic`) đã hết hạn. Thêm phụ: mỗi
   `<NavLink>` có 1 `NavPendingHint` (dùng `useLinkStatus` từ `next/link`,
   `app-shell.tsx`) — 1 dấu chấm nhỏ trên icon chỉ hiện nếu điều hướng còn
   pending sau 120ms (`.nav-hint` trong `globals.css`), tránh nhấp nháy khi
   chuyển tab đã nhanh.
2. **Hành động async (form/button)**: dùng `<Button loading>` (mới thêm ở
   `ui/button.tsx`) thay cho tự `disabled={isPending}` rời rạc — tự động
   disable + hiện spinner, đồng bộ hình ảnh "đang xử lý" ở mọi nút (Lưu,
   Góp, Ghép cặp, Ngắt kết nối, Đăng xuất...). Lỗi validation form (sai định
   dạng, mã mời sai...) vẫn hiện `text-danger` ngay dưới nút liên quan (giữ
   nguyên quy tắc cũ). Lỗi của hành động KHÔNG phải form (xoá, ngắt kết nối,
   đăng xuất — không có ô lỗi tự nhiên để hiện) dùng toast chung qua
   `useToast()` (`toast-provider.tsx`, mount 1 lần trong `AppShell`) —
   `notify(message, "error")` hiện pill đỏ (`bg-danger`) ở cùng vị trí toast
   thông báo cũ (`RealtimeNotifications` giờ cũng dùng toast này, không tự
   render riêng nữa). Hành động phá hủy (xoá khoản chi, ngắt kết nối) luôn có
   `confirm()` trước khi gọi server action — áp dụng đồng nhất ở
   `ExpenseRow`, `AddExpenseSheet`, `TogetherView`, trước đây chỉ
   `TogetherView` có.

## Vuốt để xoá khoản chi (`ExpenseRow`, 2026-07-11)

Bỏ nút "Xoá" hiện sẵn cạnh mỗi dòng chi tiêu — thay bằng vuốt sang trái, kéo
đủ xa (`SWIPE_THRESHOLD = 120px`) rồi thả tay là xoá luôn, không cần bước
"lộ nút rồi chạm nút" nữa. Cách hoạt động (`expense-row.tsx`):

- Kéo bằng Pointer Events (`onPointerDown/Move/Up`, không dùng thư viện) —
  `touch-pan-y` trên container để trình duyệt vẫn tự xử lý cuộn dọc trong
  lúc JS bắt kéo ngang, tránh xung đột với cuộn trang.
- Có ngưỡng di chuyển (`DRAG_THRESHOLD = 6px`) để phân biệt "chạm để mở sheet
  sửa" và "kéo để xoá" — không phân biệt được thì mọi lần vuốt cũng vô tình
  mở sheet sửa ngay sau khi thả tay.
- **Phản hồi màu theo tiến trình kéo**: nền + màu chữ của dòng nội suy
  (`mix()`, RGB tuyến tính) từ `--paper`/`--ink` sang `--danger` khi kéo từ
  0 → 50% của `SWIPE_THRESHOLD` (`COLOR_FULL_AT`) — tới nửa đường đã đỏ hẳn,
  báo trước "thả tay ở đây là xoá" trước khi thực sự chạm ngưỡng xoá.
- Thả tay khi đã kéo đủ `SWIPE_THRESHOLD` → `confirm()` trước khi gọi
  `deleteExpense` (không xoá ngay khi vừa chạm ngưỡng, vẫn cần xác nhận) +
  toast lỗi nếu server action fail (kèm trả dòng về vị trí cũ, không để dòng
  đứng đỏ mãi nếu xoá thất bại) — theo đúng quy ước "Loading & lỗi" ở trên.
  Kéo chưa đủ ngưỡng thì luôn bật lại về 0, không có trạng thái "nửa mở".
- **Hiệu ứng biến mất sau khi xác nhận xoá (2026-07-11)**: thay vì đứng im
  màu đỏ chờ server rồi cả danh sách giật khi `router.refresh()` trả về,
  dòng tự chạy animation biến mất ngay khi xác nhận (`phase: "removing"`) —
  cảm giác xoá tức thì, không phụ thuộc độ trễ mạng. 2 chuyển động chạy song
  song cùng lúc:
  1. Dòng tiếp tục trượt hết ra ngoài theo đúng hướng đang kéo (`offset -
     EXIT_SLIDE`) thay vì dừng khựng lại ở điểm thả tay.
  2. Wrapper ngoài (chỗ có `border-b`/`last:border-0`) co chiều cao bằng kỹ
     thuật CSS Grid `grid-template-rows: 1fr → 0fr` + fade — không cần đo
     chiều cao bằng JS (`scrollHeight`) như cách cũ, browser tự nội suy.
     `motion-reduce:transition-none` tắt hẳn animation này khi hệ thống bật
     giảm chuyển động; hướng trượt ngang cũng bỏ qua nếu
     `prefers-reduced-motion: reduce` (chỉ còn co+fade, không trượt thêm).
  - Xoá thất bại (server action trả lỗi) → `phase` về `"idle"`, `offset` về
    0 — dòng "hiện lại" đúng vị trí cũ kèm toast lỗi, không mất dữ liệu
    khỏi UI trong khi thực ra chưa xoá được.
- Đường thoát không cần gesture: chạm dòng (không vuốt) vẫn mở sheet sửa như
  cũ, và sheet sửa có nút "Xoá" riêng — người dùng không vuốt được vẫn xoá
  được qua đường đó.
- **Giọt nước ở phần nền lộ ra phía sau**: neo cố định bên phải (không di
  chuyển theo tay kéo — chỉ hiện dần ra khi dòng trượt qua), hình giọt nước
  bằng CSS thuần (`border-radius: 50% 50% 50% 0` + `rotate(-45deg)`, không
  cần SVG/thư viện blob), icon `Trash2` (lucide) đặt đè lên, không xoay theo
  để luôn thẳng đứng. Scale + opacity nội suy theo cùng `progress` với màu
  nền của dòng — giọt "lớn dần" và dòng "đỏ dần" hoàn tất cùng lúc ở 50% của
  `SWIPE_THRESHOLD`, đọc như một hiệu ứng liên tục chứ không phải 2 hiệu ứng
  rời rạc.

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
  `--a` (ocean blue) — **thay bằng icon thiết kế thật khi có**.
- Web Push, polish thị giác sâu hơn (ảnh minh hoạ, illustration...): để
  Giai đoạn sau MVP theo quyết định 2026-07-05.
