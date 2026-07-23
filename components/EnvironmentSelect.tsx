import { ENVIRONMENTS, ENVIRONMENT_ORDER, type Environment } from "@/lib/environments";

interface EnvironmentSelectProps {
  value: Environment;
  onChange: (env: Environment) => void;
  disabled?: boolean;
}

export function EnvironmentSelect({ value, onChange, disabled }: EnvironmentSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">
        Environment
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Environment)}
        disabled={disabled}
        className="h-9 px-2 pr-7 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ENVIRONMENT_ORDER.map((env) => (
          <option key={env} value={env}>
            {ENVIRONMENTS[env].label}
          </option>
        ))}
      </select>
    </div>
  );
}
