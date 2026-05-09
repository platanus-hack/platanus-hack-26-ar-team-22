import { Card, CardContent } from "@/components/ui";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "good" | "bad";
};

const toneClass = {
  neutral: "text-muted-foreground",
  good: "text-green-600 dark:text-green-300",
  bad: "text-red-600 dark:text-red-300",
};

export function StatCard({ label, value, delta, tone = "neutral" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
        {delta ? <div className={`mt-2 text-sm ${toneClass[tone]}`}>{delta}</div> : null}
      </CardContent>
    </Card>
  );
}
