import { Tag } from "@/types/types";

export interface ParsedQuickAdd {
  title: string;
  tagId: string | null;
  tagQuery: string | null;
  deadline: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | null;
  deadlineConfidence: "HIGH" | "MEDIUM" | null;
}

interface ParseQuickAddOptions {
  referenceDate?: Date;
}

interface ParsedNaturalDeadline {
  deadline: string | null;
  cleanedTitle: string;
  confidence: "HIGH" | "MEDIUM";
}

export const parseQuickAddText = (
  input: string,
  tags: Tag[],
  options: ParseQuickAddOptions = {}
): ParsedQuickAdd => {
  let title = input;
  let tagId: string | null = null;
  let tagQuery: string | null = null;
  let deadline: string | null = null;
  let priority: "LOW" | "MEDIUM" | "HIGH" | null = null;
  let deadlineConfidence: "HIGH" | "MEDIUM" | null = null;
  const referenceDate = cloneReferenceDate(options.referenceDate);

  const priorityMatch = title.match(/!(high|medium|low)\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase() as "HIGH" | "MEDIUM" | "LOW";
    title = title.replace(priorityMatch[0], "");
  }

  const tagMatch = title.match(/[\/#]([a-zA-Z0-9_\-]+)/);
  if (tagMatch) {
    tagQuery = tagMatch[1];
    const foundTag = tags.find((tag) => tag.name.toLowerCase() === tagQuery?.toLowerCase());
    if (foundTag) {
      tagId = foundTag.id.toString();
    }
    title = title.replace(tagMatch[0], "");
  }

  const dateStrMatch = title.match(/@([a-zA-Z0-9_\-:\/]+(?:\s+[0-9]{1,2}:[0-9]{2}(?:[ap]m)?)?)/i);
  if (dateStrMatch) {
    const rawDateStr = dateStrMatch[1].toLowerCase();
    deadline = parseDateString(rawDateStr, referenceDate);
    deadlineConfidence = deadline ? "HIGH" : null;
    title = title.replace(dateStrMatch[0], "");
  }

  if (!deadline) {
    const naturalResult = parseNaturalDeadline(title, referenceDate);
    if (naturalResult.deadline) {
      deadline = naturalResult.deadline;
      deadlineConfidence = naturalResult.confidence;
      title = naturalResult.cleanedTitle;
    }
  }

  title = title.replace(/\s+/g, " ").trim();

  return { title, tagId, tagQuery, deadline, priority, deadlineConfidence };
};

function parseDateString(rawStr: string, referenceDate: Date): string | null {
  const now = cloneReferenceDate(referenceDate);
  const targetDate = cloneReferenceDate(referenceDate);

  const words = rawStr.split(/\s+/);
  const dateWord = words[0];
  const timeWord = words.length > 1 ? words[1] : null;

  if (dateWord === "tomorrow") {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (dateWord === "next_week" || dateWord === "nextweek") {
    targetDate.setDate(targetDate.getDate() + 7);
  } else if (dateWord === "today") {
    // Keep today.
  } else if (dateWord.match(/^[0-9]{1,2}:[0-9]{2}$/)) {
    parseTime(dateWord, targetDate);
    return toLocalDateTimeString(targetDate);
  } else if (dateWord.match(/^[0-9]{1,2}\/[0-9]{1,2}(?:\/[0-9]{2,4})?$/)) {
    const parts = dateWord.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parts[2]
      ? parts[2].length === 2
        ? 2000 + parseInt(parts[2], 10)
        : parseInt(parts[2], 10)
      : now.getFullYear();

    targetDate.setFullYear(year, month, day);
    if (!parts[2] && targetDate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
      targetDate.setFullYear(year + 1);
    }
  } else {
    return null;
  }

  targetDate.setHours(23, 59, 0, 0);
  if (timeWord) {
    parseTime(timeWord, targetDate);
  }

  return toLocalDateTimeString(targetDate);
}

function parseTime(timeStr: string, dateObj: Date) {
  const normalized = normalizeText(timeStr);
  const timeMatch = normalized.match(
    /^([0-9]{1,2})(?:(?::|h|g|gio)\s*([0-9]{1,2}))?\s*(am|pm|sang|chieu|toi|dem)?$/
  );
  if (!timeMatch) return;

  const normalizedTime = normalizeTimeParts(timeMatch[1], timeMatch[2], timeMatch[3]);
  if (!normalizedTime) return;

  dateObj.setHours(normalizedTime.hours, normalizedTime.minutes, 0, 0);
}

function parseNaturalDeadline(input: string, referenceDate: Date): ParsedNaturalDeadline {
  const normalizedInput = normalizeText(input);
  const targetDate = cloneReferenceDate(referenceDate);
  let hasDateContext = false;

  const weekdayMatch = normalizedInput.match(/\b(thu\s*([2-7])|chu\s*nhat)(?:\s+(tuan\s+sau|toi))?\b/);
  const hasToday = /\b(hom\s+nay|today)\b/.test(normalizedInput);
  const hasTomorrow = /\b(ngay\s+mai|mai|tomorrow)\b/.test(normalizedInput);
  const daysLaterMatch = normalizedInput.match(/\b(\d{1,2})\s+ngay\s+nua\b/);
  const partOfDayToday = /\b(sang|trua|chieu|toi|dem)\s+nay\b/.test(normalizedInput);
  const partOfDayTomorrow = /\b(sang|trua|chieu|toi|dem)\s+mai\b/.test(normalizedInput);
  const weekendMatch = /\b(cuoi\s+tuan|weekend)\b/.test(normalizedInput);
  const endOfMonthMatch = /\b(cuoi\s+thang|end\s+of\s+month)\b/.test(normalizedInput);
  const afterWorkMatch = /\b(sau\s+gio\s+lam|after\s+work)\b/.test(normalizedInput);
  const startOfWeekMatch = /\b(dau\s+tuan)\b/.test(normalizedInput);
  const nextWeekMatch = /\b(tuan\s+sau|next\s+week)\b/.test(normalizedInput);

  if (hasTomorrow || partOfDayTomorrow) {
    targetDate.setDate(targetDate.getDate() + 1);
    hasDateContext = true;
  } else if (hasToday || partOfDayToday) {
    hasDateContext = true;
  } else if (daysLaterMatch?.[1]) {
    targetDate.setDate(targetDate.getDate() + parseInt(daysLaterMatch[1], 10));
    hasDateContext = true;
  } else if (weekdayMatch?.[1]) {
    moveToUpcomingWeekday(targetDate, toWeekdayIndex(weekdayMatch[1]));
    hasDateContext = true;
  } else if (weekendMatch) {
    moveToUpcomingWeekday(targetDate, 6);
    hasDateContext = true;
  } else if (endOfMonthMatch) {
    moveToEndOfMonth(targetDate);
    hasDateContext = true;
  } else if (startOfWeekMatch || nextWeekMatch) {
    moveToNextMonday(targetDate);
    hasDateContext = true;
  } else if (afterWorkMatch) {
    if (targetDate.getHours() >= 18) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    hasDateContext = true;
  }

  if (!hasDateContext) {
    return {
      deadline: null,
      cleanedTitle: input,
      confidence: "MEDIUM",
    };
  }

  const explicitTime = extractExplicitTime(normalizedInput);
  const fuzzyTime = explicitTime ? null : extractFuzzyTime(normalizedInput);

  if (explicitTime) {
    targetDate.setHours(explicitTime.hours, explicitTime.minutes, 0, 0);
  } else if (fuzzyTime) {
    targetDate.setHours(fuzzyTime.hours, fuzzyTime.minutes, 0, 0);
  } else {
    targetDate.setHours(23, 59, 0, 0);
  }

  return {
    deadline: toLocalDateTimeString(targetDate),
    cleanedTitle: cleanupNaturalDeadlineText(input),
    confidence: explicitTime ? "HIGH" : "MEDIUM",
  };
}

function extractExplicitTime(normalizedInput: string): { hours: number; minutes: number } | null {
  const prefixedTimeMatch = normalizedInput.match(
    /\bluc\s*(\d{1,2})(?:(?::|h|g|gio)\s*(\d{1,2}))?\s*(am|pm|sang|chieu|toi|dem)?\b/
  );
  if (prefixedTimeMatch) {
    return normalizeTimeParts(prefixedTimeMatch[1], prefixedTimeMatch[2], prefixedTimeMatch[3]);
  }

  const separatorTimeMatch = normalizedInput.match(
    /\b(\d{1,2})(?:(?::|h|g|gio)\s*(\d{1,2})?)\s*(am|pm|sang|chieu|toi|dem)?\b/
  );
  if (separatorTimeMatch) {
    return normalizeTimeParts(separatorTimeMatch[1], separatorTimeMatch[2], separatorTimeMatch[3]);
  }

  const periodTimeMatch = normalizedInput.match(/\b(\d{1,2})\s*(am|pm|sang|chieu|toi|dem)\b/);
  if (periodTimeMatch) {
    return normalizeTimeParts(periodTimeMatch[1], undefined, periodTimeMatch[2]);
  }

  return null;
}

function extractFuzzyTime(normalizedInput: string): { hours: number; minutes: number } | null {
  if (/\b(sau\s+gio\s+lam|after\s+work)\b/.test(normalizedInput)) {
    return { hours: 18, minutes: 0 };
  }

  const startOfDayMatch = normalizedInput.match(/\b(dau\s+gio\s+)(sang|chieu|toi)\b/);
  if (startOfDayMatch?.[2]) {
    return getStartOfPartOfDayTime(startOfDayMatch[2]);
  }

  const partOfDayMatch = normalizedInput.match(/\b(?:buoi\s+)?(sang|trua|chieu|toi|dem)\b/);
  if (partOfDayMatch?.[1]) {
    return getPartOfDayDefaultTime(partOfDayMatch[1]);
  }

  return null;
}

function normalizeTimeParts(
  rawHour: string,
  rawMinute: string | undefined,
  rawPeriod: string | undefined
): { hours: number; minutes: number } | null {
  let hours = parseInt(rawHour, 10);
  const minutes = rawMinute ? parseInt(rawMinute, 10) : 0;
  const period = rawPeriod?.toLowerCase();

  if (period === "pm" && hours < 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;
  if ((period === "chieu" || period === "toi" || period === "dem") && hours < 12) {
    hours += 12;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

function moveToUpcomingWeekday(targetDate: Date, weekday: number | null) {
  if (weekday === null) return;

  const currentWeekday = targetDate.getDay();
  let delta = (weekday - currentWeekday + 7) % 7;
  if (delta === 0) {
    delta = 7;
  }

  targetDate.setDate(targetDate.getDate() + delta);
}

function moveToNextMonday(targetDate: Date) {
  const currentWeekday = targetDate.getDay();
  const daysUntilNextMonday = ((1 - currentWeekday + 7) % 7) || 7;
  targetDate.setDate(targetDate.getDate() + daysUntilNextMonday);
}

function moveToEndOfMonth(targetDate: Date) {
  targetDate.setMonth(targetDate.getMonth() + 1, 0);
}

function toWeekdayIndex(weekdayToken: string): number | null {
  const numericMatch = weekdayToken.match(/[2-7]/);
  if (!numericMatch) {
    return weekdayToken.includes("chu") ? 0 : null;
  }

  const weekdayNumber = parseInt(numericMatch[0], 10);
  return weekdayNumber === 7 ? 6 : weekdayNumber - 1;
}

function getStartOfPartOfDayTime(partOfDayToken: string): { hours: number; minutes: number } {
  if (partOfDayToken === "sang") return { hours: 8, minutes: 0 };
  if (partOfDayToken === "chieu") return { hours: 13, minutes: 0 };
  return { hours: 19, minutes: 0 };
}

function getPartOfDayDefaultTime(partOfDayToken: string): { hours: number; minutes: number } {
  if (partOfDayToken === "sang") return { hours: 8, minutes: 0 };
  if (partOfDayToken === "trua") return { hours: 12, minutes: 0 };
  if (partOfDayToken === "chieu") return { hours: 15, minutes: 0 };
  if (partOfDayToken === "toi") return { hours: 20, minutes: 0 };
  return { hours: 22, minutes: 0 };
}

function cleanupNaturalDeadlineText(input: string): string {
  return input
    .replace(/(^|\s)(h[oô]m\s+nay|hôm\s+nay|hom\s+nay|today|ng[aà]y\s+mai|ngày\s+mai|ngay\s+mai|tomorrow|mai)(?=\s|$)/gi, " ")
    .replace(/(^|\s)(nay)(?=\s|$)/gi, " ")
    .replace(/(^|\s)(th[ứu]\s*[2-7]|thứ\s*[2-7]|thu\s*[2-7]|ch[ủu]\s*nh[ậa]t|chủ\s*nhật|chu\s*nhat)(\s+(tu[aà]n\s+sau|tuần\s+sau|tuan\s+sau|t[ớo]i|toi))?(?=\s|$)/gi, " ")
    .replace(/(^|\s)(cu[oố]i\s+tu[aà]n|cuối\s+tuần|cuoi\s+tuan|cu[oố]i\s+th[aá]ng|cuối\s+tháng|cuoi\s+thang|[đd][ầa]u\s+tu[aà]n|đầu\s+tuần|dau\s+tuan|tu[aà]n\s+sau|tuần\s+sau|tuan\s+sau|weekend)(?=\s|$)/gi, " ")
    .replace(/(^|\s)\d{1,2}\s+ng[aà]y\s+n[ữu]a(?=\s|$)/gi, " ")
    .replace(/(^|\s)(sau\s+gi[oờ]\s+l[aà]m|sau\s+giờ\s+làm|after\s+work)(?=\s|$)/gi, " ")
    .replace(/(^|\s)([đd][ầa]u\s+gi[oờ]\s+|đầu\s+giờ\s+|dau\s+gio\s+)(s[aá]ng|sáng|sang|chi[ềe]u|chiều|chieu|t[oố]i|tối|toi)(?=\s|$)/gi, " ")
    .replace(/(^|\s)(bu[oổ]i\s+)?(s[aá]ng|sáng|sang|tr[ưu]a|trưa|trua|chi[ềe]u|chiều|chieu|t[oố]i|tối|toi|[đd][êe]m|đêm|dem)(?=\s|$)/gi, " ")
    .replace(/(^|\s)(v[aà]o|vào|vao|l[úu]c|lúc|luc)(?=\s|$)/gi, " ")
    .replace(/\d{1,2}(?:(?::|h|g|gi[oờ]|giờ)\s*\d{0,2})?\s*(am|pm|s[aá]ng|sáng|sang|chi[ềe]u|chiều|chieu|t[oố]i|tối|toi|[đd][êe]m|đêm|dem)?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

function cloneReferenceDate(referenceDate?: Date): Date {
  return referenceDate ? new Date(referenceDate) : new Date();
}

function toLocalDateTimeString(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
