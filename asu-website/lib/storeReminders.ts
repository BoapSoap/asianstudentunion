export const DEFAULT_PAID_REMINDER_HOURS = 48;
export const DEFAULT_READY_FOR_PICKUP_REMINDER_HOURS = 168;

export function getPaidReminderHours() {
  return readPositiveHours(process.env.STORE_PAID_REMINDER_HOURS, DEFAULT_PAID_REMINDER_HOURS);
}

export function getReadyForPickupReminderHours() {
  return readPositiveHours(
    process.env.STORE_READY_FOR_PICKUP_REMINDER_HOURS,
    DEFAULT_READY_FOR_PICKUP_REMINDER_HOURS
  );
}

export function isReminderDue(statusUpdatedAt: string | null | undefined, thresholdHours: number, now = new Date()) {
  if (!statusUpdatedAt) {
    return false;
  }

  const updatedAt = new Date(statusUpdatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    return false;
  }

  const ageMs = now.getTime() - updatedAt.getTime();
  return ageMs >= thresholdHours * 60 * 60 * 1000;
}

function readPositiveHours(raw: string | undefined, fallback: number) {
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}
