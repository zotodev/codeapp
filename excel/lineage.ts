const lineage: ExcelLineage = {
  customers: {
    sheet: "Customers",
    orientation: "rows",
    startRow: 2,

    fields: {
      name: {
        column: "B",
      },
      age: {
        column: "C",
      },
      city: {
        column: "D",
      },
    },
  },

  sales: {
    sheet: "Sales",
    orientation: "columns",
    startColumn: "B",

    fields: {
      product: {
        row: 1,
      },
      quantity: {
        row: 2,
      },
      amount: {
        row: 3,
      },
    },
  },
};
