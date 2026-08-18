import { FIELD_LABEL_CLASS } from "@/components/form/field-styles";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/** Stacks a small caption above a form control. */
export function FormField({
  label,
  htmlFor,
  className = "flex flex-col gap-1",
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      {children}
    </div>
  );
}
