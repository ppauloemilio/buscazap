export type WeekdayHours = {
  readonly [day: string]: string | null;
};

const DAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function getWeekdayLabels(): readonly string[] {
  return DAY_LABELS;
}

export function parseBusinessHoursJson(
  raw: string | null | undefined
): WeekdayHours | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as WeekdayHours;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serializeBusinessHours(hours: WeekdayHours): string {
  return JSON.stringify(hours);
}

/** Retorna se está aberto agora com base em intervalos "HH:MM-HH:MM". */
export function isOpenNow(
  hours: WeekdayHours | null,
  now = new Date()
): boolean | null {
  if (!hours) return null;

  const dayKey = String(now.getDay());
  const range = hours[dayKey];
  if (!range || !range.includes("-")) return false;

  const [start, end] = range.split("-").map((part) => part.trim());
  if (!start || !end) return false;

  const toMinutes = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  if (endMin >= startMin) {
    return current >= startMin && current < endMin;
  }

  // Cruza meia-noite
  return current >= startMin || current < endMin;
}

export function formatBusinessHoursList(
  hours: WeekdayHours | null
): readonly { readonly label: string; readonly value: string }[] {
  if (!hours) return [];

  return DAY_LABELS.map((label, index) => {
    const range = hours[String(index)];
    return {
      label,
      value: range?.trim() ? range : "Fechado",
    };
  });
}
