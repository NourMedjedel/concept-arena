import JSZip from "jszip";
export const workbookLimits = {
  compressed: 4 * 1024 * 1024,
  expanded: 12 * 1024 * 1024,
  entry: 4 * 1024 * 1024,
  entries: 128,
  rows: 5001,
  columns: 32,
};

// Use JSZip's public streaming API so declared ZIP sizes are not trusted.
async function boundedEntry(file, budget) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0,
      failed = false;
    const stream = file.internalStream("uint8array");
    stream
      .on("data", (chunk) => {
        if (failed) return;
        size += chunk.byteLength;
        budget.used += chunk.byteLength;
        if (
          size > workbookLimits.entry ||
          budget.used > workbookLimits.expanded
        ) {
          failed = true;
          stream.pause();
          reject(
            Error(
              "The expanded workbook is too large. Use a smaller, plain study workbook.",
            ),
          );
          return;
        }
        chunks.push(chunk);
      })
      .on("error", reject)
      .on("end", () => {
        if (failed) return;
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        resolve(bytes);
      })
      .resume();
  });
}
function columnNumber(letters) {
  let n = 0;
  for (const c of letters) n = n * 26 + c.charCodeAt(0) - 64;
  return n;
}
function checkSheet(xml) {
  if (
    (xml.match(/<row\b/g) || []).length > workbookLimits.rows ||
    (xml.match(/<c(?:\s|>)/g) || []).length >
      workbookLimits.rows * workbookLimits.columns
  )
    throw Error(
      "Each sheet may contain at most 5,000 data rows and 32 columns.",
    );
  for (const match of xml.matchAll(/<row\b[^>]*\br=(["'])([^"']*)\1/g))
    if (
      !/^\d+$/.test(match[2]) ||
      Number(match[2]) < 1 ||
      Number(match[2]) > workbookLimits.rows
    )
      throw Error("Row numbers may not exceed 5,001.");
  for (const match of xml.matchAll(/<c\b[^>]*\br=(["'])([^"']*)\1/g)) {
    const address = /^([A-Z]+)(\d+)$/.exec(match[2]);
    if (
      !address ||
      columnNumber(address[1]) > workbookLimits.columns ||
      Number(address[2]) < 1 ||
      Number(address[2]) > workbookLimits.rows
    )
      throw Error("Use at most 32 columns and 5,000 data rows per sheet.");
  }
  for (const match of xml.matchAll(/<dimension\b[^>]*\bref=(["'])([^"']*)\1/g))
    for (const cell of match[2].split(":")) {
      const address = /^\$?([A-Z]+)\$?(\d+)$/.exec(cell);
      if (
        !address ||
        columnNumber(address[1]) > workbookLimits.columns ||
        Number(address[2]) > workbookLimits.rows
      )
        throw Error("The worksheet dimensions exceed the study limits.");
    }
  if (/<f(?:\s|>)/i.test(xml))
    throw Error("Use plain values, not formulas, in study sheets.");
}
export async function guardWorkbook(buffer) {
  if (
    !buffer ||
    !buffer.byteLength ||
    buffer.byteLength > workbookLimits.compressed
  )
    throw Error("Please use a workbook smaller than 4 MB.");
  const bytes = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === bytes.length
    ) {
      end = i;
      break;
    }
  }
  if (end < 0) throw Error("This file is not a valid .xlsx workbook.");
  if (
    view.getUint16(end + 4, true) ||
    view.getUint16(end + 6, true) ||
    view.getUint16(end + 10, true) > workbookLimits.entries
  )
    throw Error(
      "The workbook contains too many archive entries or uses an unsupported ZIP format.",
    );
  let archive;
  try {
    archive = await JSZip.loadAsync(buffer);
  } catch {
    throw Error("This file is not a valid .xlsx workbook.");
  }
  const files = Object.values(archive.files).filter((f) => !f.dir);
  if (files.length > workbookLimits.entries)
    throw Error("The workbook contains too many archive entries.");
  const safe = new JSZip(),
    budget = { used: 0 };
  for (const file of files) {
    const original = file.unsafeOriginalName || file.name;
    if (
      original !== file.name ||
      original.startsWith("/") ||
      original.split("/").includes("..") ||
      original.includes("\\")
    )
      throw Error("The workbook contains an unsafe archive path.");
    if (!/\.(xml|rels)$/i.test(file.name))
      throw Error(
        "Use a plain .xlsx workbook without macros, images or embedded objects.",
      );
    const bytes = await boundedEntry(file, budget),
      xml = new TextDecoder()
        .decode(bytes)
        .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (entity, code) => {
          const n =
            code[0].toLowerCase() === "x"
              ? parseInt(code.slice(1), 16)
              : Number(code);
          return n < 128 ? String.fromCharCode(n) : entity;
        });
    if (
      file.name === "[Content_Types].xml" &&
      /macroEnabled|vbaProject|activeX|oleObject/i.test(xml)
    )
      throw Error("Macros and embedded objects are not supported.");
    if (/<!DOCTYPE|<!ENTITY/i.test(xml))
      throw Error("XML entity declarations are not supported.");
    if (
      /\.rels$/i.test(file.name) &&
      /TargetMode\s*=\s*["']External["']/i.test(xml)
    )
      throw Error(
        "Remove external links from the workbook before importing it.",
      );
    if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(file.name)) checkSheet(xml);
    safe.file(file.name, bytes);
  }
  if (!safe.file("[Content_Types].xml") || !safe.file("xl/workbook.xml"))
    throw Error("This ZIP archive is not an .xlsx workbook.");
  return safe.generateAsync({ type: "uint8array", compression: "STORE" });
}
