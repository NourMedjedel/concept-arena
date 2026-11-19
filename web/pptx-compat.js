import JSZip from "jszip";

/**
 * Repair PptxGenJS 4.0.1 OOXML defects without flattening native charts.
 * Upstream: https://github.com/gitbrent/PptxGenJS/issues/1531 and /issues/1534.
 * Keep this at the shared browser/Node export boundary, not in node_modules.
 */
export async function repairPresentation(bytes) {
  const archive = await JSZip.loadAsync(bytes);
  for (const file of archive.file(/^ppt\/charts\/chart\d+\.xml$/)) {
    const xml = await file.async("string");
    const axes = new Set(
      [
        ...xml.matchAll(
          /<c:(?:catAx|valAx|serAx)\b[^>]*>[\s\S]*?<c:axId val="(\d+)"/g,
        ),
      ].map((match) => match[1]),
    );
    // 2D bar/line charts must reference only the axes actually declared.
    const repaired = xml.replace(
      /<c:(barChart|lineChart)\b[^>]*>[\s\S]*?<\/c:\1>/g,
      (chart) =>
        chart.replace(/<c:axId val="(\d+)"\s*\/>/g, (node, id) =>
          axes.has(id) ? node : "",
        ),
    );
    if (repaired !== xml) archive.file(file.name, repaired);
  }
  for (const file of archive.file(/^ppt\/embeddings\/[^/]+\.xlsx$/)) {
    const workbook = await JSZip.loadAsync(await file.async("uint8array"));
    let changed = false;
    for (const table of workbook.file(/^xl\/tables\/[^/]+\.xml$/)) {
      const xml = await table.async("string");
      const repaired = xml.replace(
        /\bref="([A-Z]+\d+:[A-Z]+\d+)'"/g,
        'ref="$1"',
      );
      if (repaired !== xml) {
        workbook.file(table.name, repaired);
        changed = true;
      }
    }
    for (const sheet of workbook.file(/^xl\/worksheets\/sheet\d+\.xml$/)) {
      const xml = await sheet.async("string");
      // This app's chart workbooks contain integer choice counts. The library
      // writes a zero count as an empty numeric <v>; retain the actual zero.
      const repaired = xml.replace(
        /<c\b([^>]*)>\s*<v>\s*<\/v>\s*<\/c>/g,
        (node, attrs) =>
          /\bt=/.test(attrs) ? node : `<c${attrs}><v>0</v></c>`,
      );
      if (repaired !== xml) {
        workbook.file(sheet.name, repaired);
        changed = true;
      }
    }
    if (changed)
      archive.file(
        file.name,
        await workbook.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
        }),
      );
  }
  return archive.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function presentationBuffer(deck) {
  return repairPresentation(await deck.write({ outputType: "uint8array" }));
}
