'use client';

interface ItemsPerPageSelectorProps {
  value: number;
  onChange: (limit: number) => void;
  options?: number[];
}

export function ItemsPerPageSelector({
  value,
  onChange,
  options = [10, 15, 20, 30, 50],
}: ItemsPerPageSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
        Elementi:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
