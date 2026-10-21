// A single-sheet .xlsx writer. An xlsx file is a zip of small XML parts, and the
// demo only ever exports one modest table, so writing the zip by hand keeps a
// multi-megabyte spreadsheet library out of the bundle. Entries are stored
// uncompressed, which Excel, Numbers and LibreOffice all open happily.

export type SheetCell = string | number | null | undefined;

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let bit = 0; bit < 8; bit += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function escapeXml(value: string) {
  return (
    value
      // XML 1.0 has no way to carry most control characters; drop them.
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  );
}

export function columnName(index: number) {
  let name = "";
  let n = index;
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

function cellXml(ref: string, value: SheetCell) {
  if (value === null || value === undefined || value === "") return `<c r="${ref}"/>`;
  if (typeof value === "number" && Number.isFinite(value))
    return `<c r="${ref}"><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}

function sheetXml(rows: SheetCell[][], widths: number[]) {
  const cols = widths.length
    ? `<cols>${widths
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join("")}</cols>`
    : "";
  const body = rows
    .map(
      (row, r) =>
        `<row r="${r + 1}">${row.map((cell, c) => cellXml(`${columnName(c)}${r + 1}`, cell)).join("")}</row>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${body}</sheetData></worksheet>`;
}

const parts = {
  contentTypes: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
  rels: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  workbookRels: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
};

function workbookXml(sheetName: string) {
  const safe = escapeXml(sheetName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31)) || "Sheet1";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safe}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
}

type ZipEntry = { name: string; data: Uint8Array; crc: number };

function dosTime(date: Date) {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function zip(entries: { name: string; text: string }[], at = new Date()) {
  const encoder = new TextEncoder();
  const { time, day } = dosTime(at);
  const prepared: ZipEntry[] = entries.map((entry) => {
    const data = encoder.encode(entry.text);
    return { name: entry.name, data, crc: crc32(data) };
  });

  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of prepared) {
    const name = encoder.encode(entry.name);
    const header = new DataView(new ArrayBuffer(30));
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(4, 20, true);
    header.setUint16(6, 0, true);
    header.setUint16(8, 0, true); // stored
    header.setUint16(10, time, true);
    header.setUint16(12, day, true);
    header.setUint32(14, entry.crc, true);
    header.setUint32(18, entry.data.length, true);
    header.setUint32(22, entry.data.length, true);
    header.setUint16(26, name.length, true);
    header.setUint16(28, 0, true);
    locals.push(new Uint8Array(header.buffer), name, entry.data);

    const record = new DataView(new ArrayBuffer(46));
    record.setUint32(0, 0x02014b50, true);
    record.setUint16(4, 20, true);
    record.setUint16(6, 20, true);
    record.setUint16(8, 0, true);
    record.setUint16(10, 0, true);
    record.setUint16(12, time, true);
    record.setUint16(14, day, true);
    record.setUint32(16, entry.crc, true);
    record.setUint32(20, entry.data.length, true);
    record.setUint32(24, entry.data.length, true);
    record.setUint16(28, name.length, true);
    record.setUint16(30, 0, true);
    record.setUint16(32, 0, true);
    record.setUint16(34, 0, true);
    record.setUint16(36, 0, true);
    record.setUint32(38, 0, true);
    record.setUint32(42, offset, true);
    central.push(new Uint8Array(record.buffer), name);

    offset += 30 + name.length + entry.data.length;
  }

  const centralSize = central.reduce((total, chunk) => total + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(4, 0, true);
  end.setUint16(6, 0, true);
  end.setUint16(8, prepared.length, true);
  end.setUint16(10, prepared.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  end.setUint16(20, 0, true);

  const chunks = [...locals, ...central, new Uint8Array(end.buffer)];
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}

export function buildXlsx(
  rows: SheetCell[][],
  { sheetName = "Sheet1", widths = [] as number[], date = new Date() } = {},
) {
  return zip(
    [
      { name: "[Content_Types].xml", text: parts.contentTypes },
      { name: "_rels/.rels", text: parts.rels },
      { name: "xl/workbook.xml", text: workbookXml(sheetName) },
      { name: "xl/_rels/workbook.xml.rels", text: parts.workbookRels },
      { name: "xl/worksheets/sheet1.xml", text: sheetXml(rows, widths) },
    ],
    date,
  );
}
