interface IcsEvent {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  date: string;            // "YYYY-MM-DD"
  timeStart?: string | null; // "HH:mm"
  timeEnd?: string | null;
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function dtLocal(date: string, time?: string | null): string {
  // ICS floating time (local, no timezone) — avoids TZ database embedding complexity.
  // YYYYMMDDTHHMMSS (no Z suffix = floating)
  const cleanDate = date.replace(/-/g, "");
  if (!time) return `${cleanDate}T000000`;
  const cleanTime = time.replace(":", "").padEnd(4, "0");
  return `${cleanDate}T${cleanTime}00`;
}

function addHours(date: string, time: string, hours: number): { date: string; time: string } {
  const d = new Date(`${date}T${time}:00`);
  d.setHours(d.getHours() + hours);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}

export function buildIcs(ev: IcsEvent): string {
  const start = dtLocal(ev.date, ev.timeStart);
  let endDate = ev.date;
  let endTime = ev.timeEnd;
  if (!endTime && ev.timeStart) {
    const plus = addHours(ev.date, ev.timeStart, 2);
    endDate = plus.date;
    endTime = plus.time;
  }
  const end = dtLocal(endDate, endTime);
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Papás en CDMX//Events//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escape(ev.title)}`,
  ];
  if (ev.location) lines.push(`LOCATION:${escape(ev.location)}`);
  if (ev.description) lines.push(`DESCRIPTION:${escape(ev.description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
