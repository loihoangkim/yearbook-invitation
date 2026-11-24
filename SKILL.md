---
name: yearbook-invitation-site
description: Xây dựng website thư mời chụp ảnh kỷ yếu dạng tĩnh, nhẹ, mobile-first, deploy trực tiếp lên GitHub Pages không cần build. Dùng khi tạo/sửa giao diện, thêm section, tối ưu ảnh hoặc deploy thư mời.
---

# Website thư mời chụp kỷ yếu

## Mục tiêu
- Trang tĩnh **1 trang (single page)**, mở mượt trên điện thoại (link gửi qua Zalo/Messenger).
- **Không build step, không backend** → push lên GitHub là chạy.
- Phong cách nhẹ nhàng: màu pastel, chữ viết tay, chuyển động chậm, nhiều khoảng trắng.
- Tổng dung lượng trang lần đầu tải < **2 MB**.

## Tech stack

| Hạng mục | Công nghệ | Ghi chú |
|---|---|---|
| Cấu trúc | **HTML5** semantic | `header`, `section`, `footer`, thẻ `meta` đầy đủ |
| Giao diện | **CSS3 thuần** | CSS variables, Flexbox/Grid, `@keyframes`, `clamp()` cho cỡ chữ responsive |
| Tương tác | **Vanilla JavaScript (ES6+)** | Không framework; đếm ngược, mở thiệp, nhạc nền, lightbox |
| Font | **Google Fonts** | Ví dụ: `Dancing Script` / `Great Vibes` (tiêu đề), `Be Vietnam Pro` / `Quicksand` (nội dung) – nhớ chọn subset `vietnamese` |
| Hiệu ứng cuộn | `IntersectionObserver` (tự viết) hoặc **AOS** qua CDN | Fade-in nhẹ khi cuộn tới section |
| Icon | **Inline SVG** hoặc Lucide/Font Awesome qua CDN | Ưu tiên inline SVG để nhẹ |
| Bản đồ | **Google Maps embed** (`<iframe>`) | Thêm `loading="lazy"` |
| Xác nhận tham gia (RSVP) | **Google Forms** (embed/link) hoặc **Formspree** | Không cần server; dữ liệu về Google Sheets |
| Nhạc nền (tuỳ chọn) | `<audio>` + nút bật/tắt | Trình duyệt chặn autoplay → chỉ phát sau khi người dùng chạm "Mở thiệp" |
| Ảnh | **WebP** (fallback JPG), `loading="lazy"`, `srcset` | Nén bằng Squoosh / `cwebp` |
| Hosting | **GitHub Pages** | Deploy từ branch `main`, thư mục root |

## Tính năng đề xuất
1. **Màn hình mở thiệp** – phong bì/overlay, chạm để mở (đồng thời kích hoạt nhạc).
2. **Cá nhân hoá tên khách** qua URL: `.../?to=Nguyen%20Van%20A` → JS đọc `URLSearchParams` và hiện "Thân mời *Nguyễn Văn A*".
3. **Hero** – tên lớp/khoá, khẩu hiệu, ảnh nền.
4. **Thông tin buổi chụp** – ngày giờ, địa điểm, dress code, lịch trình.
5. **Đếm ngược** tới ngày chụp.
6. **Album ảnh** – grid ảnh lớp + lightbox xem ảnh lớn.
7. **Bản đồ** + nút "Chỉ đường".
8. ~~RSVP~~ – không dùng (đã bỏ khỏi `settings.json`).
9. **Nút "Thêm vào lịch"** – link Google Calendar tạo sẵn.
10. **Footer** – lời cảm ơn, liên hệ ban tổ chức.

## Cấu trúc thư mục
```
/
├── index.html
├── settings.json    # TOÀN BỘ thông tin cá nhân/sự kiện – JS đọc bằng fetch()
├── css/
│   └── style.css
├── js/
│   └── main.js
├── Images/          # photo-01.jpg ... photo-09.jpg (đè file để thay ảnh)
├── assets/
│   ├── music/       # bg.mp3 (< 2 MB)
│   └── og-cover.jpg # ảnh preview khi share link (1200x630)
├── .nojekyll        # tắt Jekyll của GitHub Pages
└── README.md
```

> **Quy ước ảnh:** thư mục `Images/` chứa ảnh tên cố định `photo-01.jpg` → `photo-09.jpg`. Code chỉ tham chiếu theo tên này, nên muốn **thay ảnh / làm thư mời cho người khác** thì chỉ cần **chép file mới đè lên đúng tên** — không phải sửa code.
> - Giữ đúng tên, chữ thường, đuôi `.jpg` (GitHub Pages phân biệt hoa/thường: `Photo-01.JPG` ≠ `photo-01.jpg`).
> - Nên resize ảnh mới về rộng tối đa ~1600px, mỗi ảnh < 300–500 KB để trang tải nhanh.
> - Thêm ảnh thì đặt tiếp `photo-10.jpg`, `photo-11.jpg`... và thêm vào danh sách ảnh trong `js/main.js`.

## Cấu hình `settings.json`
- Mọi nội dung thay đổi theo người (tên, lớp, ngày giờ, địa điểm, liên hệ, link RSVP, danh sách ảnh...) nằm trong `settings.json`. **Không hard-code trong HTML/JS.**
- `main.js` load bằng `fetch('settings.json')` rồi đổ dữ liệu vào trang → đổi người khác chỉ cần sửa `settings.json` + đè ảnh trong `Images/`.
- `fetch()` **không chạy khi mở file trực tiếp** (`file://`) → phải chạy qua Live Server / `python -m http.server` hoặc GitHub Pages.
- JSON không hỗ trợ comment; chú thích đặt trong khoá `_huong_dan`.
- `ngay_gio` theo chuẩn ISO có múi giờ (`2026-12-20T07:30:00+07:00`) để đếm ngược chính xác.
- `google_maps_embed`: Google Maps → Chia sẻ → Nhúng bản đồ → chỉ copy giá trị `src="..."`.
- Lưu ý: thẻ `og:*` trong `<head>` phải ghi tay trong `index.html` (Zalo/Facebook không chạy JS), nhớ cập nhật song song với mục `chia_se`.

## Thẻ meta bắt buộc (để share Zalo/Facebook đẹp)
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thư mời chụp kỷ yếu – Lớp ...</title>
<meta name="description" content="Trân trọng mời bạn tham gia buổi chụp kỷ yếu ...">
<meta property="og:title" content="Thư mời chụp kỷ yếu">
<meta property="og:description" content="...">
<meta property="og:image" content="https://<username>.github.io/<repo>/assets/og-cover.jpg">
<meta property="og:type" content="website">
<link rel="icon" href="assets/favicon.png">
```
`og:image` phải là **URL tuyệt đối**.

## Quy tắc thiết kế
- **Mobile-first**: thiết kế cho màn 375–430px trước, rồi mở rộng bằng `@media (min-width: 768px)`.
- Bảng màu định nghĩa trong `:root` (ví dụ: kem `#FFF8F0`, hồng phấn `#F4C2C2`, xanh pastel `#BFD8D2`, chữ `#4A4A4A`).
- Animation nhẹ (`opacity`, `transform`), 0.6–1s, tôn trọng `prefers-reduced-motion`.
- Đường dẫn file luôn **tương đối** (`css/style.css`, không phải `/css/style.css`) vì site chạy dưới `/<repo>/`.
- Tên file phân biệt hoa/thường trên GitHub Pages → giữ toàn bộ chữ thường.

## Chạy thử local
- VS Code extension **Live Server**, hoặc:
  ```bash
  python -m http.server 8000
  ```

## Deploy lên GitHub Pages
```bash
git init
git add .
git commit -m "Init yearbook invitation"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```
Sau đó: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
Link: `https://<username>.github.io/<repo>/` (mất 1–2 phút để cập nhật).

## Checklist trước khi gửi thư mời
- [ ] Ảnh đã nén WebP, có `loading="lazy"` (trừ ảnh hero)
- [ ] Kiểm tra trên điện thoại thật (iOS Safari + Android Chrome)
- [ ] Link `?to=Tên` hiển thị đúng tiếng Việt có dấu
- [ ] Đếm ngược đúng múi giờ (`+07:00`)
- [ ] Bản đồ đúng địa điểm
- [ ] Ảnh preview hiện đúng khi dán link vào Zalo/Messenger
- [ ] Lighthouse (Chrome DevTools) Performance ≥ 90
