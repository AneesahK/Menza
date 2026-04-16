import { z } from "zod";

import { agColDefs } from "./ag.js";

export const tableItemConfigSchema = z.object({
  type: z.literal("table"),
  title: z.string(),
  subtitle: z.string().optional(),
  suppressAggFuncInHeader: z.boolean().optional(),
  groupDisplayType: z
    .enum(["singleColumn", "multipleColumns", "groupRows"])
    .optional(),
  autoGroupColumnDef: z
    .object({
      headerName: z.string().optional(),
      width: z.number().optional(),
      minWidth: z.number().optional(),
      maxWidth: z.number().optional(),
      pinned: z.enum(["left", "right"]).optional(),
      cellRendererParams: z
        .object({
          suppressCount: z.boolean().optional(),
          suppressPadding: z.boolean().optional(),
          suppressDoubleClickExpand: z.boolean().optional(),
          suppressEnterExpand: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  groupRowRendererParams: z
    .object({
      suppressCount: z.boolean().optional(),
      suppressPadding: z.boolean().optional(),
      suppressDoubleClickExpand: z.boolean().optional(),
      suppressEnterExpand: z.boolean().optional(),
    })
    .optional(),
  showOpenedGroup: z.boolean().optional(),
  groupDefaultExpanded: z.number().optional(),
  groupAllowUnbalanced: z.boolean().optional(),
  groupHideParentOfSingleChild: z
    .union([z.boolean(), z.literal("leafGroupsOnly")])
    .optional(),
  groupHideOpenParents: z.boolean().optional(),
  query: z
    .string()
    .describe(
      `This query will be executed against a DuckDB database. Use standard SQL syntax.
Note: each column name from the output of the query will be used as the \`fields\` in the \`colDefs\` property.`,
    )
    .optional(),
  queryLastFetched: z.coerce.date().nullish(),
  data: z.array(
    z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  ),
  colDefs: z
    .array(
      agColDefs.required({
        headerName: true,
      }),
    )
    .catch([]),
  lastModified: z.coerce.date().nullish(),
});

export type TableItemConfig = z.infer<typeof tableItemConfigSchema>;
