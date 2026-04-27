import { subDays } from "date-fns";
import { CustomSegmentFilter, SegmentKey, UserRecord } from "@/lib/types";
import { toDate, toNumber } from "@/lib/utils";

interface SegmentContext {
  now?: Date;
  totalCalls?: number;
  totalSpentInr?: number;
}

export function matchesCustomSegment(
  user: UserRecord,
  customFilter: CustomSegmentFilter | undefined,
  context: SegmentContext = {},
) {
  if (!customFilter) return true;

  const coinBalance = toNumber(user.coinBalance);
  const lastActive = toDate(user.lastActive);
  const totalSpentInr = context.totalSpentInr ?? 0;
  const totalCalls = context.totalCalls ?? 0;

  if (typeof customFilter.minCoins === "number" && coinBalance < customFilter.minCoins) {
    return false;
  }
  if (typeof customFilter.maxCoins === "number" && coinBalance > customFilter.maxCoins) {
    return false;
  }
  if (typeof customFilter.lastActiveDays === "number" && lastActive) {
    const threshold = subDays(context.now ?? new Date(), customFilter.lastActiveDays);
    if (lastActive > threshold) return false;
  }
  if (typeof customFilter.minSpendInr === "number" && totalSpentInr < customFilter.minSpendInr) {
    return false;
  }
  if (typeof customFilter.minCalls === "number" && totalCalls < customFilter.minCalls) {
    return false;
  }
  if (typeof customFilter.maxCalls === "number" && totalCalls > customFilter.maxCalls) {
    return false;
  }
  if (customFilter.city && user.city?.toLowerCase() !== customFilter.city.toLowerCase()) {
    return false;
  }
  if (customFilter.language) {
    const hasLanguage = (user.languages ?? []).some(
      (language) => language.toLowerCase() === customFilter.language?.toLowerCase(),
    );
    if (!hasLanguage) return false;
  }
  if (typeof customFilter.isHost === "boolean" && Boolean(user.isHost) !== customFilter.isHost) {
    return false;
  }

  return true;
}

export function matchesSegment(
  segment: SegmentKey,
  user: UserRecord,
  context: SegmentContext = {},
  customFilter?: CustomSegmentFilter,
) {
  const now = context.now ?? new Date();
  const createdAt = toDate(user.createdAt);
  const lastActive = toDate(user.lastActive);
  const totalCalls = context.totalCalls ?? 0;
  const totalPurchasedCoins = toNumber(user.totalCoinsPurchased);
  const coinBalance = toNumber(user.coinBalance);

  switch (segment) {
    case "all":
      return true;
    case "new_user":
      return Boolean(createdAt && createdAt >= subDays(now, 7) && totalPurchasedCoins === 0);
    case "low_balance":
      return coinBalance < 15;
    case "vip":
      return totalPurchasedCoins > 500;
    case "inactive":
      return Boolean(lastActive && lastActive < subDays(now, 7) && totalCalls > 0);
    case "first_call":
      return totalCalls === 1;
    case "at_risk":
      return Boolean(lastActive && lastActive < subDays(now, 3) && totalPurchasedCoins > 0);
    case "custom":
      return matchesCustomSegment(user, customFilter, context);
    default:
      return false;
  }
}

export function segmentLabel(segment: SegmentKey) {
  switch (segment) {
    case "all":
      return "All";
    case "new_user":
      return "New";
    case "low_balance":
      return "Low Balance";
    case "vip":
      return "VIP";
    case "inactive":
      return "Inactive";
    case "first_call":
      return "First Call";
    case "at_risk":
      return "At Risk";
    case "custom":
      return "Custom";
    default:
      return "All";
  }
}
