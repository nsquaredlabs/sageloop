"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, LucideIcon } from "lucide-react";
import { useApiPost } from "@/lib/hooks";

interface AsyncActionButtonProps {
  label: string;
  loadingLabel: string;
  icon: LucideIcon;
  apiEndpoint: string;
  navigateTo?: string;
  metadata?: string;
  onSuccess?: () => void;
  requestBody?: Record<string, unknown>;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
  refreshBeforeNavigate?: boolean;
}

export function AsyncActionButton({
  label,
  loadingLabel,
  icon: Icon,
  apiEndpoint,
  navigateTo,
  metadata,
  onSuccess,
  requestBody,
  variant = "default",
  size = "lg",
  className = "w-full",
  refreshBeforeNavigate = false,
}: AsyncActionButtonProps) {
  const router = useRouter();
  const { post, isLoading, error } = useApiPost();

  const handleAction = async () => {
    const result = await post(apiEndpoint, requestBody);

    if (result !== null) {
      if (refreshBeforeNavigate) {
        router.refresh();
      }

      if (navigateTo) {
        router.push(navigateTo);
      }

      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleAction}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            <Icon className="mr-2 h-4 w-4" />
            {label}
            {metadata && (
              <span className="ml-2 text-xs opacity-75">{metadata}</span>
            )}
          </>
        )}
      </Button>
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
