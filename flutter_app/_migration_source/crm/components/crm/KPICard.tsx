import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  deltaText?: string;
  deltaValue?: number;
  alert?: boolean;
  footer?: string;
}

export function KPICard({ title, value, deltaText, deltaValue, alert, footer }: KPICardProps) {
  const isPositive = (deltaValue ?? 0) >= 0;
  const showDelta = typeof deltaValue === "number";
  return (
    <Card className={cn(alert && "border-danger/40")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {showDelta ? (
          <div className={cn("mt-2 flex items-center gap-1 text-xs", isPositive ? "text-success" : "text-danger")}>
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {deltaText || `${Math.abs(deltaValue).toFixed(1)}% vs yesterday`}
          </div>
        ) : null}
        {footer ? <div className="mt-2 text-xs text-muted">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
