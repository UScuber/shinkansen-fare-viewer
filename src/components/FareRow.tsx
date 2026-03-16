import { cn } from "@/lib/utils";
import { formatYen } from "./ui/format";

interface FareRowProps {
  label: React.ReactNode;
  fare: number | null;
  italic?: boolean;
}

export default function FareRow({ label, fare, italic }: FareRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-100 py-1.5 last:border-b-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={cn(
          "whitespace-nowrap text-right font-mono text-sm font-bold text-indigo-900",
          italic && "italic",
        )}
      >
        {formatYen(fare)}
      </span>
    </div>
  );
}
