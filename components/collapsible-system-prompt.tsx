"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CollapsibleSystemPromptProps {
  systemPrompt: string;
  createdAt: string | null;
}

export function CollapsibleSystemPrompt({
  systemPrompt,
  createdAt,
}: CollapsibleSystemPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <Card className="mb-6 border-border/50 bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">System Prompt Context</CardTitle>
            <CardDescription>
              Snapshot from{" "}
              {createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrompt(!showPrompt)}
          >
            {showPrompt ? (
              <ChevronUp className="mr-1 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-1 h-4 w-4" />
            )}
            {showPrompt ? "Hide" : "View"} Prompt
          </Button>
        </div>
      </CardHeader>

      {showPrompt && (
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-md">
            {systemPrompt}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
