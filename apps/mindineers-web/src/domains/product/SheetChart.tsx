import { useMemo, useState } from "react";
import { sheetSeries } from "./document-tools";
export default function SheetChart({ rows }: { rows: string[][] }) {
  const [labels, setLabels] = useState(0),
    [values, setValues] = useState(1),
    [header, setHeader] = useState(true);
  const cols = Math.max(2, ...rows.map((row) => row.length));
  const series = useMemo(
    () => sheetSeries(rows, labels, values, header),
    [rows, labels, values, header],
  );
  const points = series.points.slice(0, 50);
  const maximum = Math.max(1, ...points.map((point) => Math.abs(point.value)));
  return (
    <section className="panel" aria-label="Sheet chart preview">
      <h3>Column chart</h3>
      <div className="wb-actions">
        {[
          { label: "Label column", value: labels, set: setLabels },
          { label: "Value column", value: values, set: setValues },
        ].map((control) => (
          <label key={control.label}>
            {control.label}
            <select
              value={control.value}
              onChange={(event) => control.set(Number(event.target.value))}
            >
              {Array.from({ length: cols }, (_, index) => (
                <option key={index} value={index}>
                  {String.fromCharCode(65 + index)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={header}
            onChange={(event) => setHeader(event.target.checked)}
          />{" "}
          First row contains headers
        </label>
      </div>
      <p>
        {series.points.length} numeric values · {series.omitted} nonnumeric or
        invalid rows omitted. Chart shows up to 50 values; the table includes
        every numeric value.
      </p>
      {!points.length ? (
        <p role="status">
          Add labels and numeric values to the selected columns.
        </p>
      ) : (
        <>
          <svg
            viewBox="0 0 600 240"
            width="100%"
            height="240"
            aria-hidden="true"
            focusable="false"
          >
            <line x1="0" y1="120" x2="600" y2="120" stroke="currentColor" />
            {points.map((point, index) => {
              const height = (Math.abs(point.value) / maximum) * 105;
              const width = 600 / points.length;
              return (
                <rect
                  key={point.row}
                  x={index * width + width * 0.15}
                  y={point.value >= 0 ? 120 - height : 120}
                  width={width * 0.7}
                  height={height}
                  fill="currentColor"
                />
              );
            })}
          </svg>
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Chart values"
          >
            <table>
              <caption>
                Values used in the chart; positive bars extend above zero,
                negative bars below.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Row</th>
                  <th scope="col">Label</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {series.points.map((point) => (
                  <tr key={point.row}>
                    <td>{point.row}</td>
                    <th scope="row">{point.label}</th>
                    <td>{point.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
