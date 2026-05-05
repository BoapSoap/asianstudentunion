import type { ProfileRole } from "@/lib/getCurrentProfile";

const PACIFIC_TIME_ZONE = "America/Los_Angeles";
const ALERT_START = { month: 10, day: 20 };
const RENEWAL_DATE = { month: 11, day: 3 };

export const ADMIN_DOCUMENTATION_URL =
  process.env.NEXT_PUBLIC_ADMIN_DOCUMENTATION_URL ||
  process.env.NEXT_PUBLIC_DOMAIN_RENEWAL_DOCS_URL ||
  "https://docs.google.com/document/d/1m5mxLBmxMeTt5RJo1lBmmxRYv0rTXd-nSfKN4wQ9FS0/edit?usp=sharing";

export const DOMAIN_RENEWAL_DOCS_URL = ADMIN_DOCUMENTATION_URL;

export function canSeeDomainRenewalNotice(role: ProfileRole) {
  return role === "editor" || role === "admin" || role === "owner";
}

export function getDomainRenewalNoticeState(now = new Date()) {
  const today = getPacificDateParts(now);
  const todayValue = toSortableDate(today.year, today.month, today.day);
  const renewalThisYearValue = toSortableDate(today.year, RENEWAL_DATE.month, RENEWAL_DATE.day);
  const renewalYear = todayValue <= renewalThisYearValue ? today.year : today.year + 1;
  const alertStartValue = toSortableDate(renewalYear, ALERT_START.month, ALERT_START.day);
  const renewalValue = toSortableDate(renewalYear, RENEWAL_DATE.month, RENEWAL_DATE.day);

  return {
    noticeKey: `domain-renewal-${renewalYear}`,
    renewalYear,
    isInWindow: todayValue >= alertStartValue && todayValue <= renewalValue,
    alertStartDateLabel: formatMonthDayYear(ALERT_START.month, ALERT_START.day, renewalYear),
    renewalDateLabel: formatMonthDayYear(RENEWAL_DATE.month, RENEWAL_DATE.day, renewalYear),
  };
}

function getPacificDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function toSortableDate(year: number, month: number, day: number) {
  return year * 10000 + month * 100 + day;
}

function formatMonthDayYear(month: number, day: number, year: number) {
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
