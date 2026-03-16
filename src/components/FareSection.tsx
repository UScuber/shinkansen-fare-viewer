import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FareSectionProps {
  title: string;
  children: React.ReactNode;
  note?: string;
}

export default function FareSection({
  title,
  children,
  note,
}: FareSectionProps) {
  return (
    <Card className="mb-3 gap-0 py-0">
      <CardHeader className="border-b border-gray-200 bg-indigo-50 px-3.5 py-2.5">
        <CardTitle className="text-sm text-indigo-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-3.5 py-2">{children}</CardContent>
      {note && <p className="px-3.5 pb-2 text-xs text-gray-400">{note}</p>}
    </Card>
  );
}
