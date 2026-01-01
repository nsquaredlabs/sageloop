/**
 * PatternFingerprintCard Component
 *
 * Displays a Pattern Fingerprint - the "source of truth" for quality.
 * A one-page visual spec showing what makes outputs great, designed to be:
 * - Scannable by non-technical stakeholders
 * - Shareable and printable
 * - Implementable by engineers
 *
 * Design System: Following sageloop/docs/DESIGN_SYSTEM.md
 * - Semantic color tokens (bg-background, text-foreground, text-muted-foreground)
 * - Indigo primary accent
 * - High contrast, monochrome with accent
 * - Card-based layout with clear sections
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Fingerprint,
  ArrowRight,
  Ruler,
  MessageSquare,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import type { PatternFingerprint } from "@/lib/analysis/fingerprint-generator";

interface PatternFingerprintCardProps {
  /** The generated fingerprint */
  fingerprint: PatternFingerprint;
  /** Project name for display */
  projectName: string;
  /** Success rate (0-1) for footer stats */
  successRate: number;
}

export function PatternFingerprintCard({
  fingerprint,
  projectName,
  successRate,
}: PatternFingerprintCardProps) {
  const {
    structure,
    length,
    tone,
    mustHaves,
    neverDo,
    confidence,
    sampleSize,
  } = fingerprint;

  const confidencePercent = Math.round(confidence * 100);
  const successPercent = Math.round(successRate * 100);

  // Check if we have meaningful data
  const hasData =
    sampleSize > 0 && (mustHaves.length > 0 || neverDo.length > 0);

  if (!hasData) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Fingerprint className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Fingerprint Pending</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Rate more outputs to generate a quality fingerprint. Need at least 5
            high-rated and low-rated samples.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Fingerprint className="h-5 w-5 text-primary" />
              Quality Fingerprint
            </CardTitle>
            <CardDescription className="mt-1">{projectName}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            v1
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* STRUCTURE Section */}
        <Section icon={<BarChart3 className="h-4 w-4" />} label="STRUCTURE">
          {/* Flow visualization */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {structure.pattern.map((step, index) => (
              <div key={index} className="flex items-center">
                <span className="px-3 py-1.5 bg-primary/10 text-primary font-medium text-sm rounded-md border border-primary/20">
                  {step}
                </span>
                {index < structure.pattern.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {structure.description}
          </p>
        </Section>

        {/* LENGTH Section */}
        <Section icon={<Ruler className="h-4 w-4" />} label="LENGTH">
          <p className="text-sm">
            <span className="font-semibold text-foreground">
              {length.range}
            </span>
            <span className="text-muted-foreground">
              {" "}
              ({length.description})
            </span>
          </p>
        </Section>

        {/* TONE Section */}
        <Section icon={<MessageSquare className="h-4 w-4" />} label="TONE">
          <p className="font-semibold text-foreground mb-2">{tone.primary}</p>
          <div className="flex flex-wrap gap-2">
            {tone.characteristics.map((char, index) => (
              <span
                key={index}
                className="text-xs text-muted-foreground before:content-['•'] before:mr-1"
              >
                {char}
              </span>
            ))}
          </div>
        </Section>

        {/* MUST HAVE / NEVER Section - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* MUST HAVE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Must Have
              </span>
            </div>
            <div className="space-y-2">
              {mustHaves.length > 0 ? (
                mustHaves.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{pattern}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No clear patterns detected
                </p>
              )}
            </div>
          </div>

          {/* NEVER */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Never
              </span>
            </div>
            <div className="space-y-2">
              {neverDo.length > 0 ? (
                neverDo.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{pattern}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No clear anti-patterns detected
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Footer Stats */}
      <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            <span className="font-medium text-foreground">
              {confidencePercent}%
            </span>{" "}
            Confidence
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">{sampleSize}</span>{" "}
            samples
          </span>
          <span className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">
              {successPercent}%
            </span>{" "}
            success rate
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Section component for consistent styling
 */
function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-semibold tracking-wide uppercase">
          {label}
        </span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}
