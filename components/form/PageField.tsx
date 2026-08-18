"use client";

import { FormField } from "@/components/form/FormField";
import { FIELD_INPUT_CLASS } from "@/components/form/field-styles";
import { toPathWithQuery } from "@/lib/environments";

interface PageFieldProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** Path input that strips the origin when a full URL is pasted in. */
export function PageField({ value, onChange, inputRef }: PageFieldProps) {
  function normalize() {
    onChange(toPathWithQuery(value));
  }

  return (
    <FormField label="Page" className="flex flex-col gap-1 flex-1 min-w-[220px]">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={normalize}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            normalize();
          }
        }}
        placeholder="/en/clothing"
        required
        className={FIELD_INPUT_CLASS}
      />
    </FormField>
  );
}
