/* =========================================================
   Thư mời chụp kỷ yếu – toàn bộ nội dung lấy từ settings.json
   ========================================================= */
(function () {
  "use strict";

  var TIME_ZONE = "Asia/Ho_Chi_Minh";
  var EVENT_DURATION_HOURS = 2; // độ dài sự kiện khi thêm vào Google Calendar

  var $ = function (sel) { return document.querySelector(sel); };

  /* ---------- Tiện ích ---------- */
  function bind(key, value) {
    document.querySelectorAll('[data-bind="' + key + '"]').forEach(function (el) {
      el.textContent = value || "";
      if (!value) el.hidden = true;
    });
  }

  function getGuestName(fallback) {
    var params = new URLSearchParams(window.location.search);
    var name = (params.get("to") || "").trim();
    return name ? name.slice(0, 60) : fallback;
  }

  function fmt(date, options) {
    return new Intl.DateTimeFormat("vi-VN", Object.assign({ timeZone: TIME_ZONE }, options)).format(date);
  }

  function toCalendarStamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  /* ---------- Đổ dữ liệu ---------- */
  function render(s) {
    var person = s.nguoi_moi || {};
    var event = s.su_kien || {};
    var place = s.dia_diem || {};
    var contact = s.lien_he || {};
    var album = s.album || {};

    var guest = getGuestName(s.khach_mac_dinh || "Bạn");
    var displayName = person.ho_ten || "";

    bind("guest", guest);
    bind("title", event.tieu_de);
    bind("name", displayName);
    bind("class", person.lop ? "Lớp " + person.lop : "");
    bind("years", person.nien_khoa);
    bind("school", person.truong);
    bind("message", person.loi_nhan);
    bind("time", event.gio_hien_thi);
    bind("note", event.ghi_chu);
    bind("placeName", place.ten);
    bind("placeAddress", place.dia_chi !== place.ten ? place.dia_chi : "");
    bind("contactName", contact.ten);

    if (displayName) document.title = (event.tieu_de || "Thư mời") + " – " + displayName;

    // Ngày giờ
    var eventDate = event.ngay_gio ? new Date(event.ngay_gio) : null;
    if (eventDate && !isNaN(eventDate)) {
      var weekday = fmt(eventDate, { weekday: "long" });
      bind("weekday", weekday.charAt(0).toUpperCase() + weekday.slice(1));
      bind("day", fmt(eventDate, { day: "2-digit" }));
      bind("monthYear", "Tháng " + fmt(eventDate, { month: "numeric" }) + " / " + fmt(eventDate, { year: "numeric" }));
      startCountdown(eventDate);
      setupCalendar(eventDate, event, place, displayName);
    } else {
      $("#countdown").hidden = true;
      $("#calendarBtn").hidden = true;
    }

    renderSchedule(s.lich_trinh || []);
    renderLocation(place);
    renderGallery(album);
    renderContacts(contact);
    setupMusic(s.nhac_nen || {});
  }

  /* ---------- Đếm ngược ---------- */
  function startCountdown(target) {
    var els = { d: $("#cdDays"), h: $("#cdHours"), m: $("#cdMins"), s: $("#cdSecs") };
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var timer;

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        $("#countdown").hidden = true;
        $("#countdownDone").hidden = false;
        return;
      }
      var sec = Math.floor(diff / 1000);
      els.d.textContent = Math.floor(sec / 86400);
      els.h.textContent = pad(Math.floor((sec % 86400) / 3600));
      els.m.textContent = pad(Math.floor((sec % 3600) / 60));
      els.s.textContent = pad(sec % 60);
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- Google Calendar ---------- */
  function setupCalendar(start, event, place, name) {
    var end = new Date(start.getTime() + EVENT_DURATION_HOURS * 3600 * 1000);
    var params = new URLSearchParams({
      action: "TEMPLATE",
      text: (event.tieu_de || "Chụp ảnh kỷ yếu") + (name ? " – " + name : ""),
      dates: toCalendarStamp(start) + "/" + toCalendarStamp(end),
      location: place.dia_chi || place.ten || "",
      details: event.ghi_chu || ""
    });
    $("#calendarBtn").href = "https://calendar.google.com/calendar/render?" + params.toString();
  }

  /* ---------- Lịch trình ---------- */
  function renderSchedule(items) {
    var list = $("#timeline");
    if (!items.length) { $("#scheduleSection").hidden = true; return; }

    items.forEach(function (item) {
      var li = document.createElement("li");
      var time = document.createElement("span");
      time.className = "timeline__time";
      time.textContent = item.gio || "";
      li.appendChild(time);
      li.appendChild(document.createTextNode(item.noi_dung || ""));
      list.appendChild(li);
    });
  }

  /* ---------- Bản đồ ---------- */
  function renderLocation(place) {
    if (!place.ten && !place.dia_chi) { $("#locationSection").hidden = true; return; }

    var query = place.dia_chi || place.ten;
    var embed = place.google_maps_embed ||
      "https://www.google.com/maps?q=" + encodeURIComponent(query) + "&output=embed";
    var link = place.google_maps_link ||
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);

    $("#mapFrame").src = embed;
    $("#directionBtn").href = link;
  }

  /* ---------- Album + lightbox ---------- */
  var photos = [];
  var current = 0;

  function renderGallery(album) {
    photos = (album.danh_sach || []).filter(Boolean);

    var cover = album.anh_bia || photos[0];
    if (cover) $("#coverImg").src = cover;
    else $(".hero__frame").hidden = true;

    if (!photos.length) { $("#albumSection").hidden = true; return; }

    var gallery = $("#gallery");
    photos.forEach(function (src, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery__item";
      btn.setAttribute("aria-label", "Xem ảnh " + (i + 1));

      var img = document.createElement("img");
      img.src = src;
      img.alt = "Ảnh " + (i + 1);
      img.loading = "lazy";
      img.decoding = "async";
      img.onerror = function () { btn.remove(); }; // ảnh bị thiếu thì tự ẩn

      btn.appendChild(img);
      btn.addEventListener("click", function () { openLightbox(i); });
      gallery.appendChild(btn);
    });

    setupLightbox();
  }

  function showPhoto(i) {
    current = (i + photos.length) % photos.length;
    $(".lightbox__img").src = photos[current];
    $(".lightbox__count").textContent = (current + 1) + " / " + photos.length;
  }

  function openLightbox(i) {
    showPhoto(i);
    $("#lightbox").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    $("#lightbox").hidden = true;
    document.body.style.overflow = "";
  }

  function setupLightbox() {
    var box = $("#lightbox");
    $(".lightbox__close").addEventListener("click", closeLightbox);
    $(".lightbox__nav--prev").addEventListener("click", function () { showPhoto(current - 1); });
    $(".lightbox__nav--next").addEventListener("click", function () { showPhoto(current + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) closeLightbox(); });

    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPhoto(current - 1);
      if (e.key === "ArrowRight") showPhoto(current + 1);
    });

    // Vuốt trái/phải trên điện thoại
    var startX = null;
    box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* ---------- Liên hệ ---------- */
  function renderContacts(c) {
    var links = [];
    if (c.so_dien_thoai) links.push({ label: "📞 Gọi điện", href: "tel:" + c.so_dien_thoai.replace(/\s/g, "") });
    if (c.zalo) links.push({ label: "💬 Zalo", href: /^https?:/.test(c.zalo) ? c.zalo : "https://zalo.me/" + c.zalo.replace(/\s/g, "") });
    if (c.facebook) links.push({ label: "💙 Facebook", href: c.facebook });
    if (c.instagram) links.push({ label: "📸 Instagram", href: c.instagram });

    if (!links.length) { $("#contactSection").hidden = true; return; }

    var wrap = $("#contactLinks");
    links.forEach(function (l) {
      var a = document.createElement("a");
      a.className = "btn btn--ghost";
      a.href = l.href;
      a.textContent = l.label;
      if (!/^tel:/.test(l.href)) { a.target = "_blank"; a.rel = "noopener"; }
      wrap.appendChild(a);
    });
  }

  /* ---------- Nhạc nền ---------- */
  var music = { enabled: false };

  function setupMusic(cfg) {
    music.enabled = !!(cfg.bat && cfg.file);
    music.file = cfg.file;
  }

  function playMusic() {
    if (!music.enabled) return;
    var audio = $("#bgMusic");
    var btn = $("#musicBtn");
    audio.src = music.file;
    audio.volume = 0.6;

    audio.play().then(function () {
      btn.hidden = false;
      btn.classList.add("is-playing");
    }).catch(function () {
      // Chưa có file mp3 hoặc trình duyệt chặn → ẩn nút, trang vẫn chạy bình thường
      btn.hidden = true;
    });

    btn.addEventListener("click", function () {
      if (audio.paused) {
        audio.play();
        btn.classList.add("is-playing");
        btn.classList.remove("is-muted");
      } else {
        audio.pause();
        btn.classList.remove("is-playing");
        btn.classList.add("is-muted");
      }
    });
  }

  /* ---------- Cánh hoa rơi ---------- */
  function startPetals() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var wrap = $(".petals");
    var shapes = ["❀", "✿", "♡", "❀"];
    for (var i = 0; i < 12; i++) {
      var p = document.createElement("span");
      p.className = "petal";
      p.textContent = shapes[i % shapes.length];
      p.style.left = Math.random() * 100 + "%";
      p.style.fontSize = 10 + Math.random() * 12 + "px";
      p.style.animationDuration = 9 + Math.random() * 9 + "s";
      p.style.animationDelay = -Math.random() * 15 + "s";
      wrap.appendChild(p);
    }
  }

  /* ---------- Hiện dần khi cuộn ---------- */
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Mở thiệp ---------- */
  function setupEnvelope() {
    $("#openBtn").addEventListener("click", function () {
      $("#envelope").classList.add("is-open");
      document.body.classList.remove("is-locked");
      window.scrollTo(0, 0);
      playMusic();
      startPetals();
    });
  }

  /* ---------- Khởi động ---------- */
  setupEnvelope();
  setupReveal();

  fetch("settings.json", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(render)
    .catch(function (err) {
      console.error("Không đọc được settings.json:", err);
      $("#loadError").hidden = false;
    });
})();
