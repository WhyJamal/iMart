import { Fragment } from "react";

interface Props {
  text: string | number | null | undefined;
  query: string;
  className?: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function Highlight({ text, query, className }: Props) {
  const value = text == null ? "" : String(text);
  const q = query.trim();

  if (!q) return <>{value}</>;

  const parts = value.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className={
              className ??
              "inline bg-primary text-primary-foreground rounded-xs"
            }
            style={{
              letterSpacing: "normal",
              wordSpacing: "normal",
            }}
          >
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
