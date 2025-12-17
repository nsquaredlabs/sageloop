'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/database';

interface SubscriptionStatusProps {
  plan: SubscriptionPlan;
}

export function SubscriptionStatus({ plan }: SubscriptionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{plan.display_name} Plan</CardTitle>
            <CardDescription>
              {plan.price_monthly_cents === 0
                ? 'Free forever'
                : `$${(plan.price_monthly_cents / 100).toFixed(0)}/month`}
            </CardDescription>
          </div>
          <Badge variant="secondary">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan description */}
        {plan.description && (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        )}

        {/* Plan features */}
        {plan.features && plan.features.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Included features:</p>
            <ul className="space-y-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quota summary */}
        <div className="rounded-lg bg-muted p-3 space-y-1">
          <p className="text-sm font-semibold">Monthly Quotas</p>
          <div className="text-sm text-muted-foreground space-y-0.5">
            {plan.standard_outputs_limit > 0 && (
              <p>• {plan.standard_outputs_limit.toLocaleString()} standard outputs</p>
            )}
            {plan.premium_outputs_limit > 0 && (
              <p>• {plan.premium_outputs_limit.toLocaleString()} premium outputs</p>
            )}
            {plan.standard_outputs_limit === 0 && plan.premium_outputs_limit === 0 && (
              <p>• Unlimited (with your API keys)</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
