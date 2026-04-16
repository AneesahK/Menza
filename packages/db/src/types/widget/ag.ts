import { z } from "zod";

export const agColDefs = z.object({
  field: z
    .string()
    .describe(
      "The accessor value that represents a column within the data grid",
    ),
  filter: z.boolean().optional(),
  headerName: z.string().optional(),
  cellDataType: z.enum(["text", "number", "boolean", "date"]),
  rowGroup: z
    .boolean()
    .optional()
    .describe(
      "Set to true to group rows by this column. Creates group rows for each unique value in the column.",
    ),
  rowGroupIndex: z
    .number()
    .optional()
    .describe(
      "The order to group columns when multiple columns have rowGroup=true. Lower numbers are grouped first.",
    ),
  enableRowGroup: z
    .boolean()
    .optional()
    .describe(
      "Set to true to allow this column to be used for row grouping via the Row Group Panel.",
    ),
  hide: z
    .boolean()
    .optional()
    .describe(
      "Set to true to hide the column. Often used with rowGroup=true to group by a column without showing it.",
    ),
  aggFunc: z
    .enum(["sum", "avg", "min", "max", "count", "first", "last"])
    .optional()
    .describe(
      "Aggregation function for numeric columns when row grouping is used.",
    ),
});

export const agIntegratedChartConfigSchema = z.object({
  type: z.literal("ag-integrated"),
  initial: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    chartType: z
      .enum([
        "groupedColumn",
        "stackedColumn",
        "normalizedColumn",
        "groupedBar",
        "stackedBar",
        "normalizedBar",
        "line",
        "stackedLine",
        "area",
        "pie",
        "columnLineCombo",
      ])
      .describe(
        "The difference between `column` and `bar` is that column charts have the bars positioned in the vertical axis, vs the bars pointing horizontally in bar charts. A column chart is typically preferred, even if the user asks for a `bar` chart.",
      ),
    seriesChartTypes: z
      .array(
        z.object({
          colId: z
            .string()
            .describe("The corresponding `field` from the `colDefs` property."),
          chartType: z.enum([
            "stackedColumn",
            "groupedColumn",
            "area",
            "stackedArea",
            "line",
          ]),
          secondaryAxis: z
            .boolean()
            .describe(
              "Note: only `line` and `area` series charts can be plotted on a secondary axis.",
            ),
        }),
      )
      .optional()
      .describe(
        "This is required when `columnLineCombo` is selected as the `chartType`, otherwise this field should be omitted.",
      ),
    axes: z
      .object({
        bottom: z
          .object({
            title: z.string(),
          })
          .optional(),
        left: z
          .object({
            title: z.string(),
          })
          .optional(),
      })
      .optional(),
  }),

  query: z
    .string()
    .describe(
      `This query will be executed against a DuckDB database. Use standard SQL syntax.
For bar and line charts, structure your query to have:
     1. One column that will serve as the x-axis categories (e.g., dates, names, groups)
     2. Separate columns for each series you want to plot

     When dealing with categorical data that should be separate series:
     - DO NOT use a single column for the category with a corresponding value column
     - INSTEAD, create separate columns for each category's values

     Bad:
     SELECT date, platform, spend

     Good:
     SELECT date,
            SUM(CASE WHEN platform = 'Facebook' THEN spend END) as facebook_spend,
            SUM(CASE WHEN platform = 'Google' THEN spend END) as google_spend
     `,
    )
    .optional(),
  queryLastFetched: z.coerce.date().nullish(),
  data: z.array(z.record(z.unknown())).describe(
    `The data must be structured with:
     1. One column for the x-axis (category or time)
     2. Separate columns for each series you want to plot
`,
  ),
  lastModified: z.coerce.date().nullish(),
  colDefs: z.array(
    agColDefs.extend({
      chartDataType: z
        .enum(["category", "series", "time"])
        .describe(
          `Determines how each column is used in chart construction:
           category: Used for the x-axis grouping in bar/line charts.
           series: Contains the numerical values to plot.
           time: Special category type for date-based x-axes.`,
        ),
    }),
  ),
  chartModel: z.record(z.unknown()).nullish(),
});

export type AgIntegratedChartConfig = z.infer<
  typeof agIntegratedChartConfigSchema
>;
