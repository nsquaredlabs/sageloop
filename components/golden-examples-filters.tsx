"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function GoldenExamplesFilters({
  currentFilters,
  availableTags,
}: {
  currentFilters: Record<string, string>;
  availableTags: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(currentFilters);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters =
    currentFilters.tag ||
    currentFilters.rating ||
    currentFilters.dateFrom ||
    currentFilters.dateTo;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label htmlFor="tag-filter">Tag</Label>
          <Select
            value={currentFilters.tag || "all"}
            onValueChange={(value) => updateFilter("tag", value)}
          >
            <SelectTrigger id="tag-filter" className="w-48">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating-filter">Rating</Label>
          <Select
            value={currentFilters.rating || "all"}
            onValueChange={(value) => updateFilter("rating", value)}
          >
            <SelectTrigger id="rating-filter" className="w-32">
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-from">From Date</Label>
          <Input
            id="date-from"
            type="date"
            value={currentFilters.dateFrom || ""}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to">To Date</Label>
          <Input
            id="date-to"
            type="date"
            value={currentFilters.dateTo || ""}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            className="w-40"
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
