import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
};

/** Admin की सभी सूचियों (Tasks, Users, Tests…) के लिए एक ही Table */
export default function DataTable<T>({ columns, rows, rowKey, emptyMessage = "अभी कुछ नहीं है।" }: Props<T>) {
  return (
    <div className="glass" style={{ padding: 0 }}>
      <div style={{ overflowX: "auto" }}>
        <table className="sbtbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-[color:var(--mute)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={rowKey(r)}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render(r)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
