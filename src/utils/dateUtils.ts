import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);

export { dayjs };

/**
 * Robust Date Parser for Sri Lanka Time
 */
export const parseToDayjs = (val: any) => {
  if (!val) return null;
  
  // Handle Firestore Timestamp
  if (val.seconds !== undefined) return dayjs(new Date(val.seconds * 1000));
  if (typeof val.toDate === "function") return dayjs(val.toDate());

  if (typeof val === "string") {
    const formats = [
      "DD/MM/YYYY, hh:mm:ss a",
      "DD/MM/YYYY, h:mm:ss a",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
    ];
    for (const f of formats) {
      const p = dayjs(val, f, true);
      if (p.isValid()) return p;
    }
    return dayjs(val);
  }
  return dayjs(val);
};

const SL_TIMEZONE = "Asia/Colombo";

/**
 * Formats any date input into Sri Lanka time (UTC+5:30)
 * @param date - Date string, number, or Date object
 * @param format - Desired format string (dayjs style)
 * @returns Formatted date string
 */
export const formatSL = (
  date: string | number | Date | null | undefined,
  format: string = "DD/MM/YYYY, hh:mm:ss a"
): string => {
  if (!date) return "";
  
  try {
    const d = dayjs(date);
    if (!d.isValid()) return String(date);
    
    return d.tz(SL_TIMEZONE).format(format);
  } catch (error) {
    console.error("Error formatting SL date:", error);
    return String(date);
  }
};

/**
 * Short date format for Sri Lanka
 */
export const formatSLDate = (date: any) => formatSL(date, "DD/MM/YYYY");

/**
 * Long time format for Sri Lanka
 */
export const formatSLDateTime = (date: any) => formatSL(date, "DD/MM/YYYY, hh:mm:ss a");
