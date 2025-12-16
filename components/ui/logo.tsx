import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the logo
   * - sm: 16x16px (secondary locations)
   * - md: 24x24px (default)
   * - lg: 32x32px (primary navigation, auth pages)
   */
  size?: "sm" | "md" | "lg";

  /**
   * Whether to show the "Sageloop" wordmark next to the logo
   * Default: true
   */
  showWordmark?: boolean;

  /**
   * Additional className for the container
   */
  className?: string;
}

const sizeMap = {
  sm: {
    container: "w-4 h-4",
    icon: "w-3 h-3",
    text: "text-sm",
    gap: "gap-1.5",
  },
  md: {
    container: "w-6 h-6",
    icon: "w-4 h-4",
    text: "text-base",
    gap: "gap-2",
  },
  lg: {
    container: "w-8 h-8",
    icon: "w-5 h-5",
    text: "text-lg",
    gap: "gap-2",
  },
};

/**
 * Sageloop Logo Component
 *
 * The logo consists of a triangle inside a circle, representing:
 * - Circle (stroke): The "loop" - continuous iteration and evaluation cycles
 * - Triangle (filled): Abstract wizard/expert element - domain expertise and insight
 *
 * @example
 * ```tsx
 * // Default logo with wordmark
 * <Logo />
 *
 * // Large logo in navigation
 * <Logo size="lg" />
 *
 * // Icon only (no wordmark)
 * <Logo showWordmark={false} />
 * ```
 */
export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showWordmark = true, className, ...props }, ref) => {
    const sizes = sizeMap[size];

    return (
      <div
        ref={ref}
        className={cn("flex items-center", sizes.gap, className)}
        {...props}
      >
        {/* Logo Icon */}
        <div
          className={cn(
            "rounded-lg bg-gray-900 dark:bg-white p-1.5 flex items-center justify-center",
            sizes.container
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn("text-white dark:text-gray-900", sizes.icon)}
            aria-hidden="true"
          >
            {/* Circle - The "loop" */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            {/* Triangle - The wizard/sage element */}
            <path
              d="M12 7L8 16h8L12 7z"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </div>

        {/* Wordmark */}
        {showWordmark && (
          <span className={cn("font-semibold text-foreground", sizes.text)}>
            Sageloop
          </span>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";
