import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS, type RubricCategory } from "@/lib/rubric";

type Finding = {
  score: number;
  working: string;
  missing: string;
  recommendation: string;
};

export function CategoryCard({ category, finding }: { category: RubricCategory; finding: Finding }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
          <span className="text-sm font-semibold">{finding.score}/10</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Working</p>
          <p className="mt-1">{finding.working}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missing</p>
          <p className="mt-1">{finding.missing}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendation</p>
          <p className="mt-1">{finding.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
