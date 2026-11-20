// Hour and weekday in the business timezone (IST by default), not the server's own.
// Containers usually run on UTC, which would put a 10:00 IST payment at 04:30 and trip
// night-time checks. Override with BUSINESS_TIMEZONE.
const TIMEZONE = process.env.BUSINESS_TIMEZONE || "Asia/Kolkata";

// The model was trained with Monday = 0 ... Sunday = 6.
const WEEKDAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

function localParts(date) {
  const parts = formatter.formatToParts(date || new Date());
  const get = (type) => (parts.find((p) => p.type === type) || {}).value;
  return {
    hour: Number(get("hour")) % 24,
    weekday: WEEKDAY_INDEX[get("weekday")],
  };
}

module.exports = { localParts, TIMEZONE };
