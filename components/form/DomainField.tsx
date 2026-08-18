"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/form/FormField";
import { FIELD_INPUT_CLASS } from "@/components/form/field-styles";
import { cn } from "@/lib/utils";

interface DomainFieldProps {
  /** Text to display: the draft while editing, the resolved hostname once locked. */
  value: string;
  isLocked: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
  onClear: () => void;
}

/**
 * Domain input that locks once committed, so the rest of the form can rely on a
 * stable production domain. Commits on blur or Enter.
 */
export function DomainField({
  value,
  isLocked,
  onChange,
  onCommit,
  onClear,
}: DomainFieldProps) {
  return (
    <FormField label="Domain">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            if (isLocked) {
              return;
            }
            onChange(event.target.value);
          }}
          onBlur={() => {
            if (!isLocked) {
              onCommit();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!isLocked) {
                onCommit();
              }
            }
          }}
          readOnly={isLocked}
          placeholder="example.com"
          required
          className={cn(
            FIELD_INPUT_CLASS,
            isLocked && "pr-8 bg-muted text-muted-foreground cursor-default select-none",
          )}
        />
        {isLocked && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear domain"
            className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </FormField>
  );
}
