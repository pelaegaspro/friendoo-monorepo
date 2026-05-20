'use client';

import type { CoinPackage } from '../../src/types/wallet';
import { Badge } from '../../src/components/ui/badge';
import { Card } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function pickBadge(pkg: CoinPackage) {
  if (pkg.priceInr === 99) return { label: 'POPULAR', variant: 'default' as const };
  if (pkg.priceInr === 499) return { label: 'BEST VALUE', variant: 'secondary' as const };
  return null;
}

export function CoinPackageCard({ pkg, onSelect }: { pkg: CoinPackage; onSelect: () => void | Promise<void> }) {
  const badge = pickBadge(pkg);
  const bonus = (pkg as unknown as { bonus?: unknown }).bonus;
  const bonusCoins = typeof bonus === 'number' ? bonus : 0;
  const coins = typeof pkg.coins === 'number' ? pkg.coins : 0;
  const price = typeof pkg.priceInr === 'number' ? pkg.priceInr : 0;

  return (
    <Card className="p-3 rounded-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="text-xl font-semibold tabular-nums">{coins.toLocaleString('en-IN')} coins</div>
          <div className="text-sm text-muted-foreground">{formatInr(price)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {badge ? (
            <Badge variant={badge.variant} className="rounded-full">
              {badge.label}
            </Badge>
          ) : null}
          {bonusCoins > 0 ? (
            <Badge variant="outline" className="rounded-full">
              +{bonusCoins} bonus
            </Badge>
          ) : null}
        </div>
      </div>

      <Button className="mt-3 w-full rounded-xl" onClick={onSelect}>
        Top up
      </Button>
    </Card>
  );
}

