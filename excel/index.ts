import { readSheet } from "read-excel-file/browser";

type CellValue = string | number | boolean | Date | null;

type ColumnOrientedGroup = {
  sheet: string | number;
  orientation: "columns";
  startColumn: string;

  fields: Record<
    string,
    {
      row: number;
    }
  >;
};

type RowOrientedGroup = {
  sheet: string | number;
  orientation: "rows";
  startRow: number;

  fields: Record<
    string,
    {
      column: string;
    }
  >;
};

type LineageGroup = ColumnOrientedGroup | RowOrientedGroup;

export type ExcelLineage = Record<string, LineageGroup>;

type ExtractedRecord = Record<string, CellValue>;

export type ExtractedExcelData = Record<string, ExtractedRecord[]>;

function columnToIndex(column: string): number {
  let result = 0;

  for (const char of column.toUpperCase()) {
    result = result * 26 + (char.charCodeAt(0) - "A".charCodeAt(0) + 1);
  }

  return result - 1;
}

function isEmpty(value: CellValue | undefined): boolean {
  return value === null || value === undefined || value === "";
}

export async function extractExcel(
  file: File,
  lineage: ExcelLineage,
): Promise<ExtractedExcelData> {
  const result: ExtractedExcelData = {};

  // Avoid reading the same sheet repeatedly
  const sheetCache = new Map<string | number, CellValue[][]>();

  async function getSheet(sheet: string | number): Promise<CellValue[][]> {
    const cached = sheetCache.get(sheet);

    if (cached) {
      return cached;
    }

    const rows = (await readSheet(file, sheet)) as CellValue[][];

    sheetCache.set(sheet, rows);

    return rows;
  }

  for (const [groupName, config] of Object.entries(lineage)) {
    const rows = await getSheet(config.sheet);

    const records: ExtractedRecord[] = [];

    let recordIndex = 0;

    while (true) {
      const record: ExtractedRecord = {};
      let hasAnyValue = false;

      if (config.orientation === "columns") {
        // Each COLUMN represents one record

        const startColumnIndex = columnToIndex(config.startColumn);

        const currentColumn = startColumnIndex + recordIndex;

        for (const [property, field] of Object.entries(config.fields)) {
          const rowIndex = field.row - 1;

          const value = rows[rowIndex]?.[currentColumn] ?? null;

          record[property] = value;

          if (!isEmpty(value)) {
            hasAnyValue = true;
          }
        }
      } else {
        // Each ROW represents one record

        const currentRow = config.startRow - 1 + recordIndex;

        for (const [property, field] of Object.entries(config.fields)) {
          const columnIndex = columnToIndex(field.column);

          const value = rows[currentRow]?.[columnIndex] ?? null;

          record[property] = value;

          if (!isEmpty(value)) {
            hasAnyValue = true;
          }
        }
      }

      // Stop when an entire record is blank
      if (!hasAnyValue) {
        break;
      }

      records.push(record);
      recordIndex++;
    }

    result[groupName] = records;
  }

  return result;
}
