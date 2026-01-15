"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExampleProjectTemplate } from "@/lib/onboarding/templates";

interface ExampleProjectCardProps {
  template: ExampleProjectTemplate;
}

export function ExampleProjectCard({ template }: ExampleProjectCardProps) {
  return (
    <Card className="bg-muted/50 border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">📝</span>
          {template.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{template.description}</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium">{template.model_config.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Scenarios:</span>
            <span className="font-medium">
              {template.example_scenarios.length} included
            </span>
          </div>
        </div>
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">
            Sample scenarios:
          </p>
          <ul className="text-xs space-y-1">
            {template.example_scenarios.slice(0, 3).map((scenario, i) => (
              <li key={i} className="text-muted-foreground truncate">
                &bull; {scenario}
              </li>
            ))}
            <li className="text-muted-foreground">
              &bull; ...and {template.example_scenarios.length - 3} more
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
