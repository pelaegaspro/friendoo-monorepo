import { FraudAlertRecord, FraudSeverity } from "@/lib/types";

const order: Record<FraudSeverity, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function normalizeSeverity(value: unknown): FraudSeverity {
  if (value === "urgent" || value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "low";
}

export function sortAlerts(alerts: FraudAlertRecord[]) {
  return alerts.sort((a, b) => {
    const aOrder = order[normalizeSeverity(a.severity)];
    const bOrder = order[normalizeSeverity(b.severity)];
    if (aOrder !== bOrder) {
      return bOrder - aOrder;
    }
    const aDate = typeof a.createdAt === "object" && a.createdAt && "toDate" in a.createdAt
      ? (a.createdAt as { toDate: () => Date }).toDate().getTime()
      : 0;
    const bDate = typeof b.createdAt === "object" && b.createdAt && "toDate" in b.createdAt
      ? (b.createdAt as { toDate: () => Date }).toDate().getTime()
      : 0;
    return bDate - aDate;
  });
}

export function escalateSeverity(value: FraudSeverity): FraudSeverity {
  if (value === "low") return "medium";
  if (value === "medium") return "high";
  return "urgent";
}
