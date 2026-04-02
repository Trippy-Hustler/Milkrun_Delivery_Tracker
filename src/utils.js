/**
 * Convert "1 Apr 12:26" or "31 Mar 18:45" to "1 Apr 12:26 PM" / "31 Mar 6:45 PM"
 */
export function formatTime12h(dateStr) {
  if (!dateStr) return '';
  const match = dateStr.match(/^(.+?)\s+(\d{1,2}):(\d{2})$/);
  if (!match) return dateStr;
  const [, datePart, hStr, min] = match;
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${datePart} ${h}:${min} ${ampm}`;
}
