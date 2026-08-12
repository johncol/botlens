import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

function PasswordInput({ className, ref, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className="w-full h-9 px-3 pr-9 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((previous) => !previous)}
        disabled={props.disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 h-full px-2.5 flex items-center text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        {visible ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
