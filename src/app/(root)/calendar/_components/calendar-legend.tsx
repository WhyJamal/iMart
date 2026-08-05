const ITEMS: { swatch: string; label: string }[] = [
  { swatch: "bg-white border border-border", label: "Ish kuni" },
  { swatch: "bg-muted", label: "Dam olish kuni" },
  { swatch: "bg-destructive/15", label: "Bayram" },
  { swatch: "bg-amber-100", label: "Qisqartirilgan kun" },
  { swatch: "bg-blue-100", label: "Ko'chirilgan ish kuni" },
];

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-4">
      {ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`w-3 h-3 rounded ${item.swatch}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
