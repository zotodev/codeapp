---
name: data-grid-skill
description: >-
  Implements and extends Dice UI’s Radix Data Grid (install, wiring, columns,
  cell variants, filtering, virtualization, undo). Use when adding or editing
  data grids, useDataGrid, DataGrid*, getDataGridSelectColumn, file/select/date
  cells, or when the user mentions Dice UI data grid / @diceui/data-grid.
---

# Dice UI Data Grid

High-performance editable data grid with virtualization, keyboard navigation, and cell editing (TanStack Table + TanStack Virtual, Radix/shadcn-style UI).

## When to apply

- New pages or features that need an editable, virtualized spreadsheet-style grid.
- Changes to `useDataGrid`, `DataGrid`, toolbar menus, filters, paste, search, row selection, or custom cell variants.
- After installing or updating `@diceui/*` data-grid packages via shadcn.

## Install (shadcn)

**Core**

```bash
pnpm dlx shadcn@latest add "@diceui/data-grid"
```

**Optional add-ons**

| Package | Purpose |
| --- | --- |
| `@diceui/data-grid-select-column` | `getDataGridSelectColumn` |
| `@diceui/data-grid-sort-menu` | `DataGridSortMenu` |
| `@diceui/data-grid-filter-menu` | `DataGridFilterMenu` |
| `@diceui/data-grid-row-height-menu` | `DataGridRowHeightMenu` |
| `@diceui/data-grid-view-menu` | `DataGridViewMenu` |
| `@diceui/data-grid-keyboard-shortcuts` | `DataGridKeyboardShortcuts` |
| `@diceui/data-grid-skeleton` | `DataGridSkeleton` (+ grid/toolbar parts) |
| `@diceui/use-data-grid-undo-redo` | `useDataGridUndoRedo` |

## Post-install: fix import paths

The shadcn CLI may not rewrite imports for custom `components` / `lib` paths. Apply these manually.

**`lib/data-grid.ts`** — import types from the types module, not from the main component file:

```ts
import type {
  CellPosition,
  Direction,
  FileCellData,
  RowHeightValue,
} from "@/types/data-grid";
```

**`hooks/use-data-grid.ts`** — utilities from `@/lib/data-grid`, types from `@/types/data-grid`:

```ts
import {
  getCellKey,
  getIsFileCellData,
  getIsInPopover,
  getRowHeightValue,
  getScrollDirection,
  matchSelectOption,
  parseCellKey,
  scrollCellIntoView,
} from "@/lib/data-grid";
import type {
  CellPosition,
  ContextMenuState,
  Direction,
  FileCellData,
  NavigationDirection,
  PasteDialogState,
  RowHeightValue,
  SearchState,
  SelectionState,
  CellUpdate,
} from "@/types/data-grid";
```

**All `components/data-grid/*.tsx`** — use `@/lib/data-grid` for helpers and `@/types/data-grid` for types; do not import types/helpers from `@/components/data-grid/data-grid`.

Project convention summary:

- Types → `@/types/data-grid`
- Pure helpers → `@/lib/data-grid`
- Filters → `getFilterFn` from `@/lib/data-grid-filters` when using filter menus
- UI → `@/components/data-grid/*`

## Usage patterns

### Basic grid

```tsx
import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { useDataGrid } from "@/hooks/use-data-grid";

export default function MyDataGrid() {
  const [data, setData] = React.useState(initialData);

  const columns = React.useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        meta: { cell: { variant: "short-text" } },
      },
      // ... other columns
    ],
    [],
  );

  const { table, ...dataGridProps } = useDataGrid({
    data,
    columns,
    onDataChange: setData,
    getRowId: (row) => row.id,
  });

  return (
    <>
      <DataGridKeyboardShortcuts />
      <DataGrid table={table} {...dataGridProps} />
    </>
  );
}
```

### Toolbar menus (filter, sort, row height, view)

```tsx
<div role="toolbar" aria-orientation="horizontal" className="flex items-center gap-2 self-end">
  <DataGridFilterMenu table={table} />
  <DataGridSortMenu table={table} />
  <DataGridRowHeightMenu table={table} />
  <DataGridViewMenu table={table} />
</div>
<DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
<DataGrid table={table} {...dataGridProps} />
```

### Row add / delete

```ts
const onRowAdd = React.useCallback(() => {
  setData((prev) => [...prev, { id: generateId() }]);
  return {
    rowIndex: data.length,
    columnId: "name",
  };
}, [data.length]);

const onRowsDelete = React.useCallback((rows, rowIndices) => {
  setData((prev) => prev.filter((row) => !rows.includes(row)));
}, []);

useDataGrid({
  data,
  columns,
  onDataChange: setData,
  onRowAdd,
  onRowsDelete,
  getRowId: (row) => row.id,
});
```

### Search

```ts
const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  onDataChange: setData,
  enableSearch: true,
});

<DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
```

### Paste

```ts
useDataGrid({
  data,
  columns,
  onDataChange: setData,
  enablePaste: true,
  onRowsAdd: async (count) => {
    const newRows = Array.from({ length: count }, () => ({ id: generateId() }));
    setData((prev) => [...prev, ...newRows]);
  },
});
```

### Undo / redo (`useDataGridUndoRedo`)

1. Call `useDataGridUndoRedo({ data, onDataChange: setData, getRowId, maxHistory?, enabled? })`.
2. Replace raw `setData` passed into `useDataGrid` with an `onDataChange` that:
   - Diff each **old vs new** row by keys; for each changed field push `{ rowId, columnId, previousValue, newValue }` into an `UndoRedoCellUpdate[]`.
   - If non-empty, call `trackCellsUpdate(cellUpdates)` then `setData(newData)`.
3. **`onRowAdd`**: append row to state, then `trackRowsAdd([newRow])`, return `{ rowIndex, columnId }` for focus.
4. **`onRowsDelete`**: `trackRowsDelete(rows)` then remove rows from state.
5. Render `<DataGridKeyboardShortcuts enableUndoRedo />`.

**Returns:** `canUndo`, `canRedo`, `onUndo`, `onRedo`, `onClear`, `trackCellsUpdate`, `trackRowsAdd`, `trackRowsDelete`.

**Cell diff snippet** (inside `onDataChange` passed to `useDataGrid`; import `UndoRedoCellUpdate` from the undo-redo hook/types):

```ts
const cellUpdates: UndoRedoCellUpdate[] = [];
for (let i = 0; i < data.length; i++) {
  const oldRow = data[i];
  const newRow = newData[i];
  if (!oldRow || !newRow) continue;
  for (const key of Object.keys(oldRow)) {
    const prev = oldRow[key];
    const next = newRow[key];
    if (!Object.is(prev, next)) {
      cellUpdates.push({ rowId: oldRow.id, columnId: key, previousValue: prev, newValue: next });
    }
  }
}
if (cellUpdates.length) trackCellsUpdate(cellUpdates);
setData(newData);
```

### Read-only

```ts
useDataGrid({ data, columns, readOnly: true });
```

### RTL

Wrap the tree in Radix `DirectionProvider` with `dir="rtl"`. Direction is picked up by the grid.

### Auto-focus

```ts
useDataGrid({
  data,
  columns,
  autoFocus: true,
  // or: autoFocus: { rowIndex: 0, columnId: "name" },
});
```

### Height and stretch columns

```tsx
<DataGrid
  table={table}
  {...dataGridProps}
  height={800}
  stretchColumns
/>
```

Default height in docs: **600** px if unspecified.

### Loading skeleton

```tsx
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";

<Suspense
  fallback={
    <DataGridSkeleton className="container flex flex-col gap-4 py-4">
      <DataGridSkeletonToolbar actionCount={5} />
      <DataGridSkeletonGrid />
    </DataGridSkeleton>
  }
>
  <DataGridDemo />
</Suspense>
```

## Column cell variants (`meta.cell`)

| Variant | Behavior |
| --- | --- |
| `short-text` | Single-line text, inline editing |
| `long-text` | Multi-line in popover, auto-save |
| `number` | Optional `min`, `max`, `step` |
| `url` | URL validation + clickable links |
| `checkbox` | Boolean |
| `select` | Single select; `options: { label, value }[]` |
| `multi-select` | Multi select + badges; same `options` shape |
| `date` | Date picker / calendar popover |
| `file` | Files; options: `maxFileSize`, `maxFiles`, `accept`, `multiple` |

**Number example**

```ts
meta: { cell: { variant: "number", min: 0, max: 1000, step: 0.01 } }
```

**File example**

```ts
meta: {
  cell: {
    variant: "file",
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5,
    accept: "image/*,video/*,audio/*,.pdf,.doc,.docx",
    multiple: true,
  },
},
```

**File handlers on the hook**

```ts
useDataGrid({
  data,
  columns,
  onDataChange: setData,
  onFilesUpload: async ({ files, rowIndex, columnId }) => {
    // upload → return metadata array: { id, name, size, type, url }
  },
  onFilesDelete: async ({ fileIds, rowIndex, columnId }) => {
    // delete remote files
  },
});
```

## Row selection

```ts
import { getDataGridSelectColumn } from "@/components/data-grid/data-grid-select-column";

const columns = [
  getDataGridSelectColumn<RowType>(),
  // ...other columns
];
```

`getDataGridSelectColumn` options include: `size` (default **40**), `enableHiding` (default **false**), `enableResizing` (default **false**), plus standard column options where applicable (`id`, `header`, `minSize`, `maxSize`, filter/sort flags, etc. as in TanStack ColumnDef).

Shift-click range selection works when this column is present (handled inside `useDataGrid`).

## Cell architecture

Three layers:

1. **`DataGridCell`** — reads `column.meta.cell.variant` and routes to a variant component.
2. **Variant components** (`ShortTextCell`, `NumberCell`, …) — editing UI for each type.
3. **`DataGridCellWrapper`** — shared behavior: focus ring, selection/search highlights, pointer + keyboard (Enter / F2 / Space / typing to edit).

Flow: `DataGridCell` → variant → content wrapped in `DataGridCellWrapper`.

### Custom variant skeleton

Implement `DataGridCellProps<TData>` from `@/types/data-grid`. Read `cell.getValue()`, render editor/display inside `DataGridCellWrapper` with the same props the built-ins pass through (`cell`, `tableMeta`, `rowIndex`, `columnId`, `isFocused`, `isEditing`, `isSelected`, `isSearchMatch`, `isActiveSearchMatch`, `readOnly`). Register the variant in `DataGridCell` / router module per project setup.

Built-in variant components (each implements `DataGridCellProps`, uses wrapper internally): ShortTextCell, LongTextCell, NumberCell, UrlCell, SelectCell, MultiSelectCell, CheckboxCell, DateCell, FileCell.

## Filtering, sorting, pinning, resizing

**Filtering / sort menus**

```ts
import { getFilterFn } from "@/lib/data-grid-filters";

const columns = React.useMemo(() => {
  const filterFn = getFilterFn<RowType>();
  return [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      filterFn,
      meta: {
        label: "Name",
        cell: { variant: "short-text" },
      },
    },
  ];
}, []);
```

Sorting is enabled by default unless disabled per column/table. `meta.label` drives labels in filter/sort/view menus.

**Column pinning**

```ts
useDataGrid({
  data,
  columns,
  initialState: {
    columnPinning: {
      left: ["select", "name"],
      right: ["actions"],
    },
  },
});
```

Pin/unpin can also be driven from the column header UI.

**Resizing**

Resizing is on by default: drag handle; double-click handle auto-fits. Set **`minSize`** (pixels) on column defs as needed.

## Context menu (right-click)

- **Copy** — Ctrl/Cmd+C
- **Cut** — Ctrl/Cmd+X (visual cut state)
- **Clear** — Delete / Backspace on selection
- **Delete rows** — Ctrl/Cmd+Backspace when `onRowsDelete` is provided

## Accessibility

- WAI-ARIA grid semantics
- Full keyboard navigation and visible focus
- Shortcuts for primary actions
- Screen-reader-friendly cell updates

## Keyboard reference

Use **Ctrl** on Windows/Linux and **Cmd** on macOS wherever “Ctrl/Cmd” appears.

| Area | Key | Action |
| --- | --- | --- |
| Navigation | Arrow keys | Move between cells |
| Navigation | Tab / Shift+Tab | Next / previous cell |
| Navigation | Home / End | First / last column in row |
| Navigation | Ctrl/Cmd + ↑ / ↓ | First / last row (same column) |
| Navigation | Ctrl/Cmd + ← / → | First / last column (same row) |
| Navigation | Ctrl/Cmd + Home / End | First / last cell |
| Navigation | PgUp / PgDn | Page up / down |
| Navigation | Alt + ↑ / ↓ | Scroll one page vertically |
| Navigation | Alt + PgUp / PgDn | Scroll one page of columns horizontally |
| Selection | Shift + arrows | Extend selection |
| Selection | Ctrl/Cmd + Shift + ↑ / ↓ | Select to top / bottom |
| Selection | Ctrl/Cmd + Shift + ← / → | Select to first / last column |
| Selection | Ctrl/Cmd + A | Select all cells |
| Selection | Ctrl/Cmd + click | Toggle cell in selection |
| Selection | Shift + click | Range select |
| Selection | Escape | Clear selection or exit edit mode |
| Editing | Enter / F2 / double-click | Start editing |
| Editing | Shift + Enter | Insert row below |
| Editing | Ctrl/Cmd + C / X / V | Copy / cut / paste |
| Editing | Delete / Backspace | Clear selected cells |
| Editing | Ctrl/Cmd + Backspace or Delete | Delete selected rows |
| Editing | Ctrl/Cmd + Z | Undo |
| Editing | Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y | Redo |
| Search / menus | Ctrl/Cmd + F | Open search |
| Search / menus | Enter (search open) | Next match |
| Search / menus | Shift + Enter (search open) | Previous match |
| Search / menus | Escape (search open) | Close search |
| Search / menus | Ctrl/Cmd + Shift + F | Toggle filter menu |
| Search / menus | Ctrl/Cmd + Shift + S | Toggle sort menu |
| Search / menus | Ctrl/Cmd + / | Keyboard shortcuts dialog |

## `DataGridKeyboardShortcuts` props

| Prop | Purpose |
| --- | --- |
| `enableSearch?` | Reflects whether search is enabled (affects shortcut copy) |
| `enableUndoRedo?` | Show / wire undo redo in help |
| `enablePaste?` | Paste-related hints |
| `enableRowAdd?` | Row-add shortcuts |
| `enableRowsDelete?` | Row-delete shortcuts |

Match these to the features actually enabled on `useDataGrid` / handlers.

## API reference — `useDataGrid`

| Prop | Notes |
| --- | --- |
| `data` | Row array (required) |
| `columns` | TanStack column definitions (required) |
| `onDataChange?` | Receives updated data when cells change |
| `getRowId?` | Stable id per row (strongly recommended) |
| `onRowAdd?` | Optional; return `{ rowIndex, columnId }` for focus |
| `onRowsAdd?` | Batch add (e.g. paste); `async (count) => void` |
| `onRowsDelete?` | `(rows, rowIndices) => void` |
| `onFilesUpload?` | File cell uploads |
| `onFilesDelete?` | File cell deletions |
| `dir?` | Text direction override |
| `rowHeight?` | Row height preset |
| `overscan?` | Virtualizer overscan |
| `autoFocus?` | `boolean` or `{ rowIndex, columnId }` |
| `enableColumnSelection?` | Column selection behavior |
| `enableSearch?` | Ctrl/Cmd+F search |
| `enablePaste?` | Clipboard paste |
| `readOnly?` | Disable editing |
| `defaultColumn?` | TanStack default column |
| `initialState?` | Table initial state (pinning, visibility, sorting, …) |
| `state?` | Controlled table state |

Hook return includes **`table`** plus spread props for **`DataGrid`** (refs, virtualization fields, selection, search, context menu, paste dialog, etc.).

## API reference — `DataGrid` (main component)

Typical props passed from `useDataGrid` spread:

| Prop | Role |
| --- | --- |
| `table` | TanStack table instance |
| `tableMeta` | Custom meta for cells / handlers |
| `columns` | Column defs |
| `dataGridRef`, `headerRef`, `footerRef`, `rowMapRef` | Layout / measure refs |
| `virtualTotalSize`, `virtualItems`, `measureElement` | Virtualization |
| `dir?` | Direction |
| `height?` | Pixel height |
| `stretchColumns?` | Fill width |
| `searchState?`, `searchMatchesByRow`, `activeSearchMatch` | Search |
| `columnSizeVars` | CSS vars for widths |
| `cellSelectionMap`, `focusedCell`, `editingCell` | Interaction state |
| `rowHeight` | Current row height |
| `contextMenu` | Context menu controller |
| `pasteDialog` | Paste dialog state |
| `onRowAdd?` | Passed through for UI that adds rows |

## Other components (props surface)

| Component | Primary props |
| --- | --- |
| `DataGridColumnHeader` | `header`, `table` |
| `DataGridCell` | `cell`, `table`, `rowIndex`, `columnId`, focus/edit/selection/search flags, `readOnly` |
| `DataGridCellWrapper` | Same interaction props as cell; wraps children |
| `DataGridRow` | `row`, `tableMeta`, `virtualItem`, `measureElement`, `rowMapRef`, `rowHeight`, pinning/visibility, focus/edit selection, `dir`, `readOnly`, `stretchColumns` |
| `DataGridSearch` | `searchQuery`, `onSearchQueryChange`, `searchMatches`, `matchIndex`, `searchOpen`, `onSearchOpenChange`, navigate prev/next, `onSearch` |
| `DataGridFilterMenu` | `table`, optional `disabled` |
| `DataGridSortMenu` | `table`, optional `disabled` |
| `DataGridRowHeightMenu` | `table`, optional `disabled` |
| `DataGridViewMenu` | `table`, optional `disabled` |
| `DataGridContextMenu` | `table` |
| `DataGridPasteDialog` | `tableMeta`, `pasteDialog` |
| `DataGridSkeleton` | Container; compose `DataGridSkeletonToolbar` (`align?`, `actionCount?`) and `DataGridSkeletonGrid` |

## Feature summary

**Core:** Virtualized rows/columns (10k+ rows), nine cell variants, multi-cell selection, Excel-like shortcuts, copy/cut/paste (Excel/Sheets), undo/redo via `useDataGridUndoRedo`, context menu, search (Ctrl/Cmd+F), filtering (operators + reorder), multi-sort (reorder), row add/delete callbacks, column resize / pin / hide / reorder.

**Cell types:** Short/long text, constrained numbers, validated URLs, calendar dates, single/multi-select with search, checkbox booleans, multi-file cells with upload/delete hooks.

**Advanced:** Smart paste expanding the grid, type-to-edit, row heights (short → extra-tall), RTL (`DirectionProvider`), read-only mode, auto-focus on mount, strong ARIA grid accessibility.

## Cross-check before finishing

- [ ] Types from `@/types/data-grid`; helpers from `@/lib/data-grid`; `getFilterFn` when filters are used.
- [ ] Each editable column has appropriate `meta.cell` (variant + options).
- [ ] `DataGridKeyboardShortcuts` flags match enabled features (`enableSearch`, `enableUndoRedo`, paste, row add/delete).
- [ ] File columns implement `onFilesUpload` / `onFilesDelete`.
- [ ] Stable `getRowId` for mutations, paste, and undo.
