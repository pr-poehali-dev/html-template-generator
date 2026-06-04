import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Типы ───────────────────────────────────────────────────────────────────

interface Doctor {
  fullname: string;
  profname: string;
  rnum: string;
  depname: string;
  schedule: Record<string, string[]>;
}

// ─── Демо-данные ─────────────────────────────────────────────────────────────

const CSV_DATA = `[CSVDATA]`;

const DEMO_DOCTORS: Doctor[] = [
  { fullname: "Оганян Мария Андреевна", profname: "Врач-онколог, КМН", rnum: "117", depname: "Онкология", schedule: { "04.06.2026": ["13:00 - 16:00"] } },
  { fullname: "Петрова Светлана Ивановна", profname: "Кардиолог, Д.м.н.", rnum: "204", depname: "Кардиология", schedule: { "04.06.2026": ["09:00 - 13:00"] } },
  { fullname: "Козлов Дмитрий Сергеевич", profname: "Хирург высшей категории", rnum: "118", depname: "Онкология", schedule: { "04.06.2026": ["14:00 - 18:00"] } },
  { fullname: "Морозова Анна Викторовна", profname: "Невролог, КМН", rnum: "312", depname: "Неврология", schedule: { "04.06.2026": ["10:00 - 14:00"] } },
  { fullname: "Соколов Игорь Павлович", profname: "Терапевт высшей категории", rnum: "105", depname: "Терапия", schedule: { "04.06.2026": ["08:00 - 12:00"] } },
  { fullname: "Николаева Елена Юрьевна", profname: "Кардиолог, КМН", rnum: "205", depname: "Кардиология", schedule: { "04.06.2026": ["13:00 - 17:00"] } },
  { fullname: "Васильев Алексей Романович", profname: "Невролог", rnum: "310", depname: "Неврология", schedule: { "04.06.2026": ["09:00 - 13:00"] } },
  { fullname: "Захарова Ирина Михайловна", profname: "Терапевт", rnum: "106", depname: "Терапия", schedule: { "04.06.2026": ["14:00 - 18:00"] } },
  { fullname: "Тихонов Сергей Владимирович", profname: "Хирург, КМН", rnum: "120", depname: "Онкология", schedule: { "04.06.2026": ["08:00 - 12:00"] } },
  { fullname: "Семёнова Ольга Дмитриевна", profname: "Кардиолог", rnum: "206", depname: "Кардиология", schedule: { "04.06.2026": ["16:00 - 18:00"] } },
  { fullname: "Лебедев Константин Иванович", profname: "Хирург-онколог", rnum: "119", depname: "Онкология", schedule: { "04.06.2026": ["10:00 - 14:00"] } },
  { fullname: "Фёдорова Наталья Петровна", profname: "Невролог, Д.м.н.", rnum: "311", depname: "Неврология", schedule: { "04.06.2026": ["15:00 - 18:00"] } },
  { fullname: "Богданов Виктор Андреевич", profname: "Терапевт, КМН", rnum: "107", depname: "Терапия", schedule: { "04.06.2026": ["09:00 - 13:00"] } },
  { fullname: "Крылова Татьяна Сергеевна", profname: "Кардиолог высшей категории", rnum: "207", depname: "Кардиология", schedule: { "04.06.2026": ["08:00 - 12:00"] } },
  { fullname: "Громов Павел Николаевич", profname: "Онколог", rnum: "121", depname: "Онкология", schedule: { "04.06.2026": ["13:00 - 17:00"] } },
];

// ─── Парсинг CSV ─────────────────────────────────────────────────────────────

function parseCsv(csv: string): Doctor[] {
  const rows = csv.split("\n").filter((r) => r.trim());
  if (rows.length < 2) return [];
  const headers = rows[0].split(";").map((h) => h.trim());
  const map: Record<string, Doctor> = {};
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(";").map((c) => c.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => (obj[h] = cols[j] || ""));
    const key = `${obj.fullname}__${obj.depname}`;
    if (!map[key]) {
      map[key] = { fullname: obj.fullname, profname: obj.profname, rnum: obj.rnum, depname: obj.depname, schedule: {} };
    }
    if (obj.wdate) {
      if (!map[key].schedule[obj.wdate]) map[key].schedule[obj.wdate] = [];
      map[key].schedule[obj.wdate].push(`${obj.begtime} - ${obj.endtime}`);
    }
  }
  return Object.values(map);
}

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: "#dbeafe", fg: "#1d4ed8" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#ede9fe", fg: "#6d28d9" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#ffedd5", fg: "#c2410c" },
  { bg: "#cffafe", fg: "#0e7490" },
];

function getAvatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}

function mergeSlots(slots: string[]) {
  if (!slots.length) return [];
  const parsed = slots
    .map((s) => { const [a, b] = s.split(" - "); return { s: a, e: b }; })
    .sort((a, b) => a.s.localeCompare(b.s));
  const merged = [{ ...parsed[0] }];
  for (let i = 1; i < parsed.length; i++) {
    const last = merged[merged.length - 1];
    if (parsed[i].s <= last.e) { if (parsed[i].e > last.e) last.e = parsed[i].e; }
    else merged.push({ ...parsed[i] });
  }
  return merged.map((m) => `${m.s} – ${m.e}`);
}

// ─── Карточка врача ──────────────────────────────────────────────────────────

function DoctorCard({ doctor, todayKey }: { doctor: Doctor; todayKey: string }) {
  const palette = getAvatarPalette(doctor.fullname);
  const slots = mergeSlots(doctor.schedule[todayKey] || []);

  return (
    <div className="doctor-card animate-fade-in">
      <div className="card-header">
        <div className="cabinet-chip">
          <span className="chip-label">Кабинет</span>
          <span className="chip-num">{doctor.rnum}</span>
        </div>
      </div>
      <div className="card-content">
        <div className="doctor-text">
          <p className="doctor-fullname">{doctor.fullname}</p>
          <p className="doctor-prof">{doctor.profname}</p>
          {slots.length > 0 ? (
            <div className="time-list">
              {slots.map((sl, i) => (
                <div key={i} className="time-item">
                  <Icon name="Clock3" size={12} />
                  <span>{sl}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-schedule">Приёма нет</p>
          )}
        </div>
        <div
          className="doctor-avatar"
          style={{ background: palette.bg, color: palette.fg }}
        >
          {getInitials(doctor.fullname)}
        </div>
      </div>
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function Index() {
  const [now, setNow] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("Все");
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);

  const todayKey = (() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
  })();

  const doctors = CSV_DATA.trim() && CSV_DATA !== "[CSVDATA]"
    ? parseCsv(CSV_DATA)
    : DEMO_DOCTORS;

  const departments = ["Все", ...Array.from(new Set(doctors.map((d) => d.depname)))];
  const filtered = activeFilter === "Все" ? doctors : doctors.filter((d) => d.depname === activeFilter);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const speed = 0.7;
    const tick = () => {
      const el = scrollRef.current;
      if (!el) { rafRef.current = requestAnimationFrame(tick); return; }
      posRef.current += speed * dirRef.current;
      el.scrollTop = posRef.current;
      if (posRef.current + el.clientHeight >= el.scrollHeight - 4) {
        dirRef.current = 0;
        setTimeout(() => {
          posRef.current = 0;
          el.scrollTop = 0;
          dirRef.current = 1;
        }, 2500);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => { rafRef.current = requestAnimationFrame(tick); }, 4000);
    return () => { clearTimeout(delay); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const weekday = now.toLocaleDateString("ru-RU", { weekday: "long" });

  return (
    <div className="sched-root">
      {/* ── Шапка ── */}
      <header className="sched-header">
        <div className="hdr-left">
          <div className="hdr-clock">{timeStr}</div>
          <div className="hdr-date">
            <span>{dateStr}</span>
            <span className="hdr-weekday">{weekday}</span>
          </div>
        </div>

        <div className="hdr-center">
          <div className="hdr-logo">
            <Icon name="Stethoscope" size={22} />
          </div>
          <h1 className="hdr-title">Расписание приёма специалистов</h1>
        </div>

        <div className="hdr-right">
          <div className="hdr-count">
            <Icon name="Users" size={15} />
            <span>{filtered.length} врачей</span>
          </div>
        </div>
      </header>

      {/* ── Фильтры ── */}
      <nav className="filters-wrap">
        {departments.map((dep) => (
          <button
            key={dep}
            onClick={() => setActiveFilter(dep)}
            className={`filter-pill ${activeFilter === dep ? "filter-pill--active" : ""}`}
          >
            {dep}
          </button>
        ))}
      </nav>

      {/* ── Сетка ── */}
      <div className="cards-scroll" ref={scrollRef}>
        <div className="cards-grid">
          {filtered.map((doc, i) => (
            <DoctorCard key={i} doctor={doc} todayKey={todayKey} />
          ))}
        </div>
      </div>
    </div>
  );
}
