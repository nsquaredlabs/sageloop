'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RatingFormProps {
  projectId: string;
  outputId: string;
}

const COMMON_TAGS = [
  'Helpful',
  'Clear',
  'Professional',
  'Too long',
  'Too short',
  'Off-topic',
  'Incorrect',
  'Good tone',
  'Bad tone',
  'Missing details',
];

export function RatingForm({ projectId, outputId }: RatingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stars, setStars] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags((prev) => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (stars === 0) {
      setError('Please select a star rating');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/outputs/${outputId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          stars,
          feedback_text: feedbackText || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      // Navigate back to outputs page
      router.push(`/projects/${projectId}/outputs`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star Rating */}
      <div className="space-y-2">
        <Label>
          Rating <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setStars(rating)}
              onMouseEnter={() => setHoveredStar(rating)}
              onMouseLeave={() => setHoveredStar(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  rating <= (hoveredStar || stars)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
          {stars > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {stars === 1 && 'Poor'}
              {stars === 2 && 'Fair'}
              {stars === 3 && 'Good'}
              {stars === 4 && 'Very Good'}
              {stars === 5 && 'Excellent'}
            </span>
          )}
        </div>
      </div>

      {/* Feedback Text */}
      <div className="space-y-2">
        <Label htmlFor="feedback">Feedback (optional)</Label>
        <Textarea
          id="feedback"
          placeholder="What made this output good or bad? What could be improved?"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          Your feedback will help identify patterns in good vs. bad outputs
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags (optional)</Label>
        <div className="space-y-3">
          {/* Common Tags */}
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Selected Custom Tags */}
          {selectedTags.filter((tag) => !COMMON_TAGS.includes(tag)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags
                .filter((tag) => !COMMON_TAGS.includes(tag))
                .map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          )}

          {/* Add Custom Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addCustomTag}>
              Add
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Tag outputs to categorize and track patterns
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/outputs`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || stars === 0}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Rating
        </Button>
      </div>
    </form>
  );
}
