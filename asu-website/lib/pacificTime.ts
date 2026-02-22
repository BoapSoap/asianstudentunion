const PACIFIC_TIME_ZONE = "America/Los_Angeles";

function parseDateTimeInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const validationDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() + 1 !== month ||
    validationDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return asUtc - date.getTime();
}

export function pacificDateTimeInputToUtcIso(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { value: null, error: null as string | null };
  }

  const parsed = parseDateTimeInput(trimmed);
  if (!parsed) {
    return {
      value: null,
      error: "Display end must be a valid datetime in YYYY-MM-DDTHH:mm format.",
    };
  }

  const naiveUtcMs = Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute, 0);

  let offset = getTimeZoneOffsetMs(new Date(naiveUtcMs), PACIFIC_TIME_ZONE);
  let utcMs = naiveUtcMs - offset;

  const nextOffset = getTimeZoneOffsetMs(new Date(utcMs), PACIFIC_TIME_ZONE);
  if (nextOffset !== offset) {
    offset = nextOffset;
    utcMs = naiveUtcMs - offset;
  }

  return { value: new Date(utcMs).toISOString(), error: null as string | null };
}

export function utcIsoToPacificDateTimeInput(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const year = map.year;
  const month = map.month;
  const day = map.day;
  const hour = map.hour;
  const minute = map.minute;

  if (!year || !month || !day || !hour || !minute) return "";

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function formatUtcIsoInPacific(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
