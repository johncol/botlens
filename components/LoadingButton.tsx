"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  isLoading: boolean;
  /** Replaces the label while loading. Omit to show the spinner on its own. */
  loadingLabel?: string;
};

export function LoadingButton({
  isLoading,
  loadingLabel,
  disabled,
  children,
  ...buttonProps
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...buttonProps}>
      {isLoading ? (
        <>
          <Loader2
            className={`w-3.5 h-3.5 animate-spin${loadingLabel ? " mr-1.5" : ""}`}
          />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
