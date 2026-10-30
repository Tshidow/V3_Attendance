/* =====================================================================
   University of Swabi - Attendance app
   Edit the lists below to change teachers, class or students.
   ===================================================================== */
const UNIVERSITY = "University of Swabi";
const CLASS_NAME = "BS AI 1st Semester";

// Sample teacher names - replace with your real teachers (or use "Add new teacher" in the app)

const DEFAULT_TEACHERS = [
  "M. Qamar Ali",
  "Ms. Aysha",
  "M. Sajjad",
  "Ms. Hira Ali",
  "M. Shayan",
  "Abid Anwar"
];

const STUDENTS = [{ name: "Amna Tariq", father_name: "Unknown", roll_number: "01" },
  { name: "Wajeea Tariq", father_name: "Unknown", roll_number: "04" },
  { name: "Seema Rashid", father_name: "Unknown", roll_number: "09" },
  { name: "Maryam Shakeel", father_name: "Unknown", roll_number: "11" },
  { name: "ANEEQA JANNAT", father_name: "Unknown", roll_number: "12" },
  { name: "SAMAN PARVAIZ", father_name: "Unknown", roll_number: "13" },
  { name: "AIMAN KHAN", father_name: "Unknown", roll_number: "28" },
  { name: "HABIBA GUL", father_name: "Unknown", roll_number: "44" }
];

const STATUS = { g: "Present", y: "Leave", r: "Absent" };
const K = {
  records: "attendance_records_v1",
  teachers: "attendance_teachers_v1",
  teacher: "attendance_teacher_sel_v1",
  logo: "attendance_logo_v1"
};

/* Placeholder emblem used until you choose your own logo with "Change logo" */
const DEFAULT_LOGO = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16336f"/><stop offset="1" stop-color="#0b1f4b"/></linearGradient></defs>' +
  '<circle cx="100" cy="100" r="96" fill="url(#g)"/>' +
  '<circle cx="100" cy="100" r="88" fill="none" stroke="#f5b301" stroke-width="5"/>' +
  '<path d="M52 82c16-6 32-4 48 6 16-10 32-12 48-6v62c-16-6-32-4-48 6-16-10-32-12-48-6z" fill="#fff"/>' +
  '<path d="M100 88v62" stroke="#0b1f4b" stroke-width="4"/>' +
  '<path d="M100 36l7.5 15 16.5 2.4-12 11.7 2.8 16.4-14.8-7.8-14.8 7.8 2.8-16.4-12-11.7 16.5-2.4z" fill="#f5b301"/>' +
  '</svg>');

/* ---------------- storage helpers ---------------- */
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
}
function removeKey(key) { try { localStorage.removeItem(key); } catch (e) {} }

/* ---------------- state ---------------- */
let records = load(K.records, {});           // { "2026-10-28": { "01": "g", ... } }
let teachers = load(K.teachers, null) || DEFAULT_TEACHERS.slice();
let teacher = load(K.teacher, "");
let logoSrc = load(K.logo, null) || DEFAULT_LOGO;
let currentDate = todayStr();
let pdfBlob = null, pdfName = "";

const $ = id => document.getElementById(id);
const els = {
  teacherSelect: $("teacherSelect"), nextBtn: $("nextBtn"), list: $("list"), dateInput: $("dateInput"),
  genBtn: $("genBtn"), genLabel: $("genLabel"), barFill: $("barFill"), loader: $("loader"),
  sheet: $("sheet"), sheetBackdrop: $("sheetBackdrop"), toast: $("toast"), logoInput: $("logoInput")
};

/* ---------------- date helpers ---------------- */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function parseDate(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function fmtShort(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
function fmtLong(s) { const d = parseDate(s); return DAYS[d.getDay()] + ", " + fmtShort(d); }
function fmtNow() {
  const d = new Date();
  return fmtShort(d) + ", " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

/* ---------------- attendance data ---------------- */
function dayMarks() {
  if (!records[currentDate]) records[currentDate] = {};
  return records[currentDate];
}
function counts() {
  const m = dayMarks(), c = { g: 0, y: 0, r: 0, done: 0 };
  STUDENTS.forEach(s => { const v = m[s.roll_number]; if (v) { c[v]++; c.done++; } });
  return c;
}
function isComplete() { return counts().done === STUDENTS.length; }

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function initials(name) {
  const p = name.trim().split(/\s+/);
  return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => els.toast.classList.remove("show"), 2200);
}
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- logo ---------------- */
function applyLogo() { document.querySelectorAll(".logo-img").forEach(i => { i.src = logoSrc; }); }

$("logoBtn").addEventListener("click", () => els.logoInput.click());
$("logoResetBtn").addEventListener("click", () => {
  removeKey(K.logo); logoSrc = DEFAULT_LOGO; applyLogo(); toast("Default logo restored");
});
els.logoInput.addEventListener("change", e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const N = 256, c = document.createElement("canvas");
      c.width = c.height = N;
      const x = c.getContext("2d");
      const s = Math.min(N / img.width, N / img.height), w = img.width * s, h = img.height * s;
      x.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
      logoSrc = c.toDataURL("image/png");
      if (!save(K.logo, logoSrc)) toast("Logo set for now (phone storage is full)");
      else toast("Logo updated");
      applyLogo();
    };
    img.onerror = () => toast("Could not read that image");
    img.src = fr.result;
  };
  fr.readAsDataURL(f);
  els.logoInput.value = "";
});

/* ---------------- screens + Android back button ---------------- */
function showScreen(name, push) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === "screen-" + name));
  window.scrollTo(0, 0);
  if (push) history.pushState({ s: name }, "");
}
window.addEventListener("popstate", e => {
  hideSheet();
  els.loader.classList.remove("show");
  showScreen((e.state && e.state.s) || "setup", false);
});

/* ---------------- screen 1: teacher ---------------- */
const ADD_VALUE = "__add__";
function buildTeacherSelect() {
  let h = '<option value="" disabled' + (teacher ? "" : " selected") + ">Select teacher</option>";
  teachers.forEach(t => { h += '<option value="' + esc(t) + '"' + (t === teacher ? " selected" : "") + ">" + esc(t) + "</option>"; });
  h += '<option value="' + ADD_VALUE + '">+ Add new teacher…</option>';
  els.teacherSelect.innerHTML = h;
  els.nextBtn.disabled = !teacher;
}
els.teacherSelect.addEventListener("change", () => {
  const v = els.teacherSelect.value;
  if (v === ADD_VALUE) {
    const name = (prompt("Teacher name:") || "").trim();
    if (name) {
      if (!teachers.includes(name)) { teachers.push(name); save(K.teachers, teachers); }
      teacher = name;
    }
    buildTeacherSelect();
    return;
  }
  teacher = v;
  els.nextBtn.disabled = !teacher;
});
els.nextBtn.addEventListener("click", () => {
  if (!teacher) return;
  save(K.teacher, teacher);
  $("hdrTeacher").textContent = teacher;
  render();
  showScreen("attend", true);
});

/* ---------------- screen 2: attendance ---------------- */
const GRADS = [
  "linear-gradient(135deg,#2457d6,#0b1f4b)", "linear-gradient(135deg,#0ea5a4,#0f766e)", "linear-gradient(135deg,#8b5cf6,#5b21b6)",
  "linear-gradient(135deg,#f97316,#c2410c)", "linear-gradient(135deg,#ec4899,#9d174d)", "linear-gradient(135deg,#16a34a,#166534)"
];
const CHECK = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

function render() {
  const m = dayMarks();
  els.list.innerHTML = STUDENTS.map((s, i) => {
    const cur = m[s.roll_number] || "";
    const opts = ["g", "y", "r"].map(k =>
      '<button class="opt ' + k + (cur === k ? " on" : "") + '" data-roll="' + esc(s.roll_number) + '" data-v="' + k + '">' +
      '<span class="ring">' + CHECK + "</span>" + STATUS[k] + "</button>"
    ).join("");
    return '<div class="card" id="c' + esc(s.roll_number) + '" data-s="' + cur + '">' +
      '<div class="who"><div class="avatar" style="background:' + GRADS[i % GRADS.length] + '">' + esc(initials(s.name)) + "</div>" +
      '<div class="meta"><div class="name">' + esc(s.name) + '</div><div class="father">S/O ' + esc(s.father_name) + "</div></div>" +
      '<div class="roll">Roll ' + esc(s.roll_number) + "</div></div>" +
      '<div class="opts">' + opts + "</div></div>";
  }).join("");
  updateStats();
}

function updateStats() {
  const c = counts(), total = STUDENTS.length;
  $("sTotal").textContent = total;
  $("sG").textContent = c.g;
  $("sY").textContent = c.y;
  $("sR").textContent = c.r;
  $("progressText").textContent = c.done + " of " + total + " marked";
  const pct = Math.round(c.done / total * 100);
  $("progressPct").textContent = pct + "%";
  els.barFill.style.width = pct + "%";
  const done = c.done === total;
  els.genBtn.disabled = !done;
  els.genBtn.classList.toggle("ready", done);
  els.genLabel.textContent = done ? "Generate PDF" : "Mark all students (" + (total - c.done) + " left)";
}

els.list.addEventListener("click", e => {
  const btn = e.target.closest(".opt");
  if (!btn) return;
  const roll = btn.dataset.roll, v = btn.dataset.v, m = dayMarks();
  if (m[roll] === v) delete m[roll]; else m[roll] = v;   // tap again to clear
  save(K.records, records);
  const card = btn.closest(".card");
  card.dataset.s = m[roll] || "";
  card.querySelectorAll(".opt").forEach(o => o.classList.toggle("on", m[roll] === o.dataset.v));
  if (m[roll]) { btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop"); }
  buzz(12);
  updateStats();
});

els.dateInput.addEventListener("change", () => {
  currentDate = els.dateInput.value || todayStr();
  render();
});
$("backBtn").addEventListener("click", () => history.back());

/* ---------------- generate PDF (only when the button is tapped) ---------------- */
els.genBtn.addEventListener("click", async () => {
  if (!isComplete()) return;
  els.loader.classList.add("show");
  const t0 = Date.now();
  let blob = null;
  try {
    let logo = null;
    try { logo = await getLogoRGB(); } catch (e) { logo = null; }
    blob = buildPDF(logo);
  } catch (e) { blob = null; }
  await sleep(Math.max(0, 1600 - (Date.now() - t0)));   // keep the loader visible long enough to see
  els.loader.classList.remove("show");
  if (!blob) { toast("Could not create the PDF. Please try again."); return; }
  pdfBlob = blob;
  pdfName = "Attendance_BS-AI_" + currentDate + ".pdf";
  $("sheetFile").textContent = pdfName + "  ·  " + Math.max(1, Math.round(blob.size / 1024)) + " KB";
  showSheet();
});

function showSheet() {
  history.pushState({ s: "attend", sheet: 1 }, "");
  els.sheetBackdrop.classList.add("show");
  els.sheet.classList.add("show");
  let canShare = false;
  try { canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], pdfName, { type: "application/pdf" })] })); } catch (e) {}
  $("shareBtn").hidden = !canShare;
}
function hideSheet() {
  els.sheetBackdrop.classList.remove("show");
  els.sheet.classList.remove("show");
}
function closeSheet() {
  if (history.state && history.state.sheet) history.back(); else hideSheet();
}
$("closeSheetBtn").addEventListener("click", closeSheet);
els.sheetBackdrop.addEventListener("click", closeSheet);

$("dlBtn").addEventListener("click", () => {
  if (!pdfBlob) return;
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url; a.download = pdfName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
  toast("Downloading PDF…");
});
$("shareBtn").addEventListener("click", async () => {
  try {
    const file = new File([pdfBlob], pdfName, { type: "application/pdf" });
    await navigator.share({ files: [file], title: "Attendance - " + CLASS_NAME });
  } catch (e) { /* cancelled */ }
});

/* ---------------- logo -> raw RGB for the PDF ---------------- */
function getLogoRGB() {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const N = 160, c = document.createElement("canvas");
        c.width = c.height = N;
        const x = c.getContext("2d");
        x.fillStyle = "#ffffff"; x.fillRect(0, 0, N, N);
        const iw = img.naturalWidth || 200, ih = img.naturalHeight || 200;
        const s = Math.min(N / iw, N / ih), w = iw * s, h = ih * s;
        x.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
        const d = x.getImageData(0, 0, N, N).data;
        const out = new Uint8Array(N * N * 3);
        for (let i = 0, j = 0; i < d.length; i += 4) { out[j++] = d[i]; out[j++] = d[i + 1]; out[j++] = d[i + 2]; }
        resolve({ w: N, h: N, data: out });
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = logoSrc;
  });
}

/* =====================================================================
   Offline PDF writer (no libraries needed)
   ===================================================================== */
const PC = {
  navy: "0.043 0.122 0.294", gold: "0.961 0.702 0.004", white: "1 1 1", ink: "0.059 0.090 0.165",
  slate: "0.392 0.455 0.545", zebra: "0.957 0.965 0.984", line: "0.85 0.88 0.93", soft: "0.78 0.83 0.95",
  g: "0.086 0.639 0.290", y: "0.961 0.620 0.043", r: "0.863 0.149 0.149",
  gt: "0.906 0.969 0.929", yt: "0.996 0.953 0.863", rt: "0.992 0.910 0.910", nt: "0.906 0.929 0.980"
};
function pdfText(s) { return String(s).replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1"); }
function T(font, size, x, y, str, color) { return "BT /" + font + " " + size + " Tf " + color + " rg " + x + " " + y + " Td (" + pdfText(str) + ") Tj ET\n"; }
function R(x, y, w, h, color) { return color + " rg " + x + " " + y + " " + w + " " + h + " re f\n"; }
const BW = { P: 667, r: 389, e: 556, s: 556, n: 611, t: 333, L: 611, a: 556, A: 722, b: 611 };
function boldW(str, size) { let w = 0; for (const ch of str) w += BW[ch] || 556; return w * size / 1000; }

function buildPDF(logo) {
  const marks = dayMarks(), cnt = counts(), total = STUDENTS.length;
  const FIRST_Y = 505, NEXT_Y = 748, ROW = 22, LIMIT = 84;
  const capFirst = Math.floor((FIRST_Y - LIMIT) / ROW) + 1;
  const capNext = Math.floor((NEXT_Y - LIMIT) / ROW) + 1;

  const chunks = [STUDENTS.slice(0, capFirst)];
  for (let i = capFirst; i < total; i += capNext) chunks.push(STUDENTS.slice(i, i + capNext));
  const nPages = chunks.length;
  const generated = fmtNow();

  const pages = chunks.map((rows, p) => {
    let c = "", y;

    if (p === 0) {
      // banner
      c += R(0, 722, 595, 120, PC.navy) + R(0, 718, 595, 4, PC.gold);
      c += R(34, 743, 76, 76, PC.white);
      c += "q 68 0 0 68 38 747 cm /Im1 Do Q\n";
      c += T("F2", 25, 126, 786, UNIVERSITY.toUpperCase(), PC.white);
      c += T("F1", 13, 126, 764, "Student Attendance Report", PC.soft);
      c += R(126, 752, 46, 2.5, PC.gold);

      // info block
      c += T("F2", 8, 40, 696, "TEACHER", PC.slate) + T("F2", 13, 40, 678, teacher || "-", PC.ink);
      c += T("F2", 8, 310, 696, "CLASS", PC.slate) + T("F2", 13, 310, 678, CLASS_NAME, PC.ink);
      c += T("F2", 8, 40, 650, "DATE", PC.slate) + T("F2", 13, 40, 632, fmtLong(currentDate), PC.ink);
      c += T("F2", 8, 310, 650, "GENERATED", PC.slate) + T("F2", 13, 310, 632, generated, PC.ink);
      c += R(40, 616, 515, 0.8, PC.line);

      // stat boxes
      const boxes = [
        ["TOTAL STUDENTS", total, PC.navy, PC.nt], ["PRESENT", cnt.g, PC.g, PC.gt],
        ["Leave", cnt.y, PC.y, PC.yt], ["ABSENT", cnt.r, PC.r, PC.rt]
      ];
      boxes.forEach((b, i) => {
        const bx = 40 + i * 132;
        c += R(bx, 560, 119, 44, b[3]) + R(bx, 560, 5, 44, b[2]);
        c += T("F2", 8, bx + 15, 590, b[0], PC.slate) + T("F2", 20, bx + 15, 568, String(b[1]), b[2]);
      });

      // table header
      c += R(40, 520, 515, 24, PC.navy);
      y = FIRST_Y;
    } else {
      c += R(0, 800, 595, 42, PC.navy) + R(0, 797, 595, 3, PC.gold);
      c += T("F2", 12, 40, 816, UNIVERSITY.toUpperCase() + "  -  Attendance Report", PC.white);
      c += T("F1", 9, 40, 780, CLASS_NAME + "  |  " + fmtLong(currentDate) + "  |  " + (teacher || "-"), PC.slate);
      c += R(40, 760, 515, 24, PC.navy);
      y = NEXT_Y;
    }
    const hy = p === 0 ? 528 : 768;
    c += T("F2", 9, 48, hy, "ROLL", PC.white) + T("F2", 9, 96, hy, "STUDENT NAME", PC.white);
    c += T("F2", 9, 252, hy, "FATHER NAME", PC.white) + T("F2", 9, 456, hy, "ATTENDANCE", PC.white);

    rows.forEach((s, k) => {
      const v = marks[s.roll_number], label = STATUS[v];
      if (k % 2 === 0) c += R(40, y - 7, 515, ROW, PC.zebra);
      c += T("F2", 10, 48, y, s.roll_number, PC.navy);
      c += T("F1", 10.5, 96, y, s.name, PC.ink);
      c += T("F1", 10.5, 252, y, s.father_name, PC.slate);
      c += R(452, y - 5, 66, 17, PC[v]);
      c += T("F2", 9, 452 + (66 - boldW(label, 9)) / 2, y, label, PC.white);
      y -= ROW;
    });

    if (p === nPages - 1) {
      c += R(390, 66, 165, 0.8, PC.slate);
      c += T("F1", 8.5, 390, 54, "Teacher signature", PC.slate);
    }
    c += R(40, 38, 515, 0.6, PC.line);
    c += T("F1", 8, 40, 26, UNIVERSITY + "  -  " + CLASS_NAME, PC.slate);
    c += T("F1", 8, 500, 26, "Page " + (p + 1) + " of " + nPages, PC.slate);
    return c;
  });

  // ---- assemble objects: 1 catalog, 2 pages, 3/4 fonts, 5 logo image, then page + content pairs
  const objs = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = "<< /Type /Pages /Kids [" + pages.map((_, i) => (6 + i * 2) + " 0 R").join(" ") + "] /Count " + nPages + " >>";
  objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let iw = 1, ih = 1, raw = "\xff\xff\xff";
  if (logo && logo.data) {
    iw = logo.w; ih = logo.h;
    const parts = [];
    for (let i = 0; i < logo.data.length; i += 8192) parts.push(String.fromCharCode.apply(null, logo.data.subarray(i, i + 8192)));
    raw = parts.join("");
  }
  objs[5] = "<< /Type /XObject /Subtype /Image /Width " + iw + " /Height " + ih +
    " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length " + raw.length + " >>\nstream\n" + raw + "\nendstream";

  pages.forEach((content, i) => {
    const pg = 6 + i * 2, ct = 7 + i * 2;
    objs[pg] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents " + ct + " 0 R >>";
    objs[ct] = "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream";
  });

  let out = "%PDF-1.4\n";
  const offsets = [];
  for (let n = 1; n < objs.length; n++) {
    offsets[n] = out.length;
    out += n + " 0 obj\n" + objs[n] + "\nendobj\n";
  }
  const xref = out.length;
  out += "xref\n0 " + objs.length + "\n0000000000 65535 f \n";
  for (let n = 1; n < objs.length; n++) out += String(offsets[n]).padStart(10, "0") + " 00000 n \n";
  out += "trailer\n<< /Size " + objs.length + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";

  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: "application/pdf" });
}

/* ---------------- start ---------------- */
$("className").textContent = CLASS_NAME;
$("hdrClass").textContent = CLASS_NAME;
$("hdrTeacher").textContent = teacher;
els.dateInput.value = currentDate;
if (teacher && !teachers.includes(teacher)) teacher = "";
applyLogo();
buildTeacherSelect();
history.replaceState({ s: "setup" }, "");

/* ---------------- Register Service Worker ---------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered!', reg))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

