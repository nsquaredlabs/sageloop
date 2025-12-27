"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { sanitize } from "@/lib/security/sanitize";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface GoldenExample {
  id: number;
  stars: number;
  feedback_text: string | null;
  tags: string[] | null;
  created_at: string;
  output: {
    id: number;
    output_text: string;
    scenario: {
      id: number;
      input_text: string;
    };
  };
}

export function GoldenExamplesTable({
  examples,
}: {
  examples: GoldenExample[];
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (examples.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">
            No golden examples found. Rate some outputs 4-5 stars to see them
            here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Rating</TableHead>
          <TableHead className="w-1/4">Input</TableHead>
          <TableHead className="w-1/3">Output Preview</TableHead>
          <TableHead className="w-32">Tags</TableHead>
          <TableHead className="w-32">Date</TableHead>
          <TableHead className="w-28">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {examples.map((example) => (
          <React.Fragment key={example.id}>
            <TableRow>
              <TableCell>
                <Badge variant={example.stars === 5 ? "default" : "secondary"}>
                  {"⭐".repeat(example.stars)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="line-clamp-2 text-sm">
                  {sanitize.plainText(example.output.scenario.input_text)}
                </p>
              </TableCell>
              <TableCell className="max-w-md">
                <div className="space-y-1">
                  <p className="line-clamp-2 text-sm">
                    {sanitize.plainText(example.output.output_text)}
                  </p>
                  {example.feedback_text && (
                    <p className="text-xs italic text-muted-foreground line-clamp-1">
                      "{sanitize.plainText(example.feedback_text)}"
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {example.tags?.slice(0, 2).map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {sanitize.plainText(tag)}
                    </Badge>
                  ))}
                  {example.tags && example.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{example.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(example.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(example.output.output_text, "Output")
                    }
                    title="Copy output"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setExpandedRow(
                        expandedRow === example.id ? null : example.id,
                      )
                    }
                    title={expandedRow === example.id ? "Collapse" : "Expand"}
                  >
                    {expandedRow === example.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            {expandedRow === example.id && (
              <TableRow>
                <TableCell colSpan={6} className="bg-muted/30">
                  <div className="space-y-4 p-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">Input</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              example.output.scenario.input_text,
                              "Input",
                            )
                          }
                        >
                          <Copy className="mr-2 h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap rounded-md bg-background p-3 border">
                        {sanitize.plainText(example.output.scenario.input_text)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">Output</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              example.output.output_text,
                              "Output",
                            )
                          }
                        >
                          <Copy className="mr-2 h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap rounded-md bg-background p-3 border">
                        {sanitize.plainText(example.output.output_text)}
                      </p>
                    </div>
                    {example.feedback_text && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Feedback</h4>
                        <p className="text-sm italic text-muted-foreground rounded-md bg-background p-3 border">
                          {sanitize.plainText(example.feedback_text)}
                        </p>
                      </div>
                    )}
                    {example.tags && example.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">All Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {example.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {sanitize.plainText(tag)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
