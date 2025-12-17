import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { UsageMeter } from '@/components/subscription/usage-meter';
import { SubscriptionStatus } from '@/components/subscription/subscription-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import type { SubscriptionPlan, WorkbenchSubscription } from '@/types/database';

export const metadata = {
  title: 'Subscription | Sageloop',
  description: 'Manage your subscription and usage',
};

export default async function SubscriptionPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's first workbench
  const { data: userWorkbenches } = await supabase
    .from('user_workbenches')
    .select('workbench_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!userWorkbenches) {
    return (
      <div>
        <p>No workbench found.</p>
      </div>
    );
  }

  // Get subscription with limits
  const { data: subscription, error: subError } = await supabase.rpc(
    'get_workbench_subscription',
    {
      workbench_uuid: userWorkbenches.workbench_id as string,
    }
  );

  if (subError || !subscription || subscription.length === 0) {
    return (
      <div>
        <p>No active subscription found.</p>
      </div>
    );
  }

  const sub = subscription[0] as WorkbenchSubscription;

  // Get full plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', sub.plan_id)
    .single();

  if (!plan) {
    return (
      <div>
        <p>Plan details not found.</p>
      </div>
    );
  }

  const typedPlan = plan as unknown as SubscriptionPlan;

  // Get other available plans for upgrade CTAs
  const { data: availablePlans } = await supabase
    .from('subscription_plans')
    .select('id, display_name, price_monthly_cents, is_available')
    .neq('id', 'free')
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <SubscriptionStatus plan={typedPlan} />

      {/* Usage Meters */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Usage This Month</h2>

        {/* Standard outputs usage */}
        {sub.standard_outputs_limit > 0 && (
          <UsageMeter
            used={sub.standard_outputs_used}
            limit={sub.standard_outputs_limit}
            resetDate={sub.current_period_end}
            modelTier="standard"
          />
        )}

        {/* Premium outputs usage (only show if plan has premium quota) */}
        {sub.premium_outputs_limit > 0 && (
          <UsageMeter
            used={sub.premium_outputs_used}
            limit={sub.premium_outputs_limit}
            resetDate={sub.current_period_end}
            modelTier="premium"
          />
        )}
      </div>

      {/* Upgrade CTA for free tier users */}
      {sub.plan_id === 'free' && availablePlans && availablePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Need More Outputs?</CardTitle>
            <CardDescription>
              Upgrade to get higher limits and access to premium models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show upcoming plans */}
            <div className="grid gap-4 sm:grid-cols-3">
              {availablePlans.map((upgradePlan) => (
                <div key={upgradePlan.id} className="rounded-lg border p-4 space-y-2">
                  <p className="font-semibold">{upgradePlan.display_name}</p>
                  <p className="text-2xl font-bold">
                    ${(upgradePlan.price_monthly_cents / 100).toFixed(0)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  {!upgradePlan.is_available && (
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                  )}
                </div>
              ))}
            </div>

            {/* External waitlist link */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <a
                  href="https://tally.so/r/ZjojeA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  Join Waitlist for Paid Plans
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              We'll notify you as soon as paid plans are available
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
