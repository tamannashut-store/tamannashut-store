const ageRow = /^(\d+\s*[–—-]\s*\d+\s*(?:Months?|Years?))\s*[:|]\s*(.+)$/i;

export function measurementInCm(value) {
  const text = String(value);
  // Only convert known numeric measurements; retain unavailable or annotated cells.
  if (!/^\d+(?:\.\d+)?(?:\s*[–—-]\s*\d+(?:\.\d+)?)?$/.test(text)) return text;
  return text.replace(/\d+(?:\.\d+)?/g, (number) => String(Math.round(Number(number) * 25.4) / 10));
}

// Parse supplier text without calculating or filling missing measurements.
export function parseSizeChart(text) {
  const sections = [];
  const notes = [];
  let columns = [];
  let title = "";
  let current;
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const header = line.match(/\((age\s*\/[^)]+)\)/i)?.[1]
      || line.match(/^Each row:\s*(Age\s*\|.+)$/i)?.[1];
    if (header) {
      columns = header.split(/[|/]/).map((cell) => cell.trim());
      continue;
    }
    const row = line.match(ageRow);
    if (row) {
      const cells = [row[1], ...row[2].split(/[|/]/).map((cell) => cell.trim())];
      if (!columns.length || cells.length !== columns.length) return null;
      if (!current) {
        current = { title, columns: [...columns], rows: [] };
        sections.push(current);
      }
      current.rows.push(cells);
    } else if (/^size chart\b/i.test(line)) {
      continue;
    } else if (/^(White|Black|.*Jacket)\b/i.test(line) && !/[.:]/.test(line)) {
      title = line;
      current = undefined;
    } else {
      notes.push(line);
    }
  }
  return sections.length ? { sections, notes, inches: /\binches\b/i.test(text) } : null;
}
