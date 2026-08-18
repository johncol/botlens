"use client";

import { FormField } from "@/components/form/FormField";
import { FIELD_INPUT_CLASS } from "@/components/form/field-styles";
import { cn } from "@/lib/utils";

interface PortFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

/** Port input shown only when an environment points at the user's machine. */
export function PortField({ id, value, onChange }: PortFieldProps) {
  return (
    <FormField label="Port" htmlFor={id}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="3000"
        required
        className={cn(FIELD_INPUT_CLASS, "w-24")}
      />
    </FormField>
  );
}
