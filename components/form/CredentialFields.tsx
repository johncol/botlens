"use client";

import { Lock } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { FIELD_INPUT_CLASS } from "@/components/form/field-styles";
import { cn } from "@/lib/utils";
import type { PageCredentials } from "@/lib/page-prefill";

interface CredentialFieldsProps {
  credentials: PageCredentials;
  onChange: (field: keyof PageCredentials, value: string) => void;
  /** When false the inputs render dimmed and disabled instead of being hidden. */
  isEnabled?: boolean;
  labelClassName?: string;
  usernameClassName?: string;
  passwordClassName?: string;
}

/**
 * Basic-auth username and password pair for environments behind a login. Values
 * live in memory only — nothing here is persisted.
 */
export function CredentialFields({
  credentials,
  onChange,
  isEnabled = true,
  labelClassName,
  usernameClassName = "w-40",
  passwordClassName = "w-48",
}: CredentialFieldsProps) {
  return (
    <>
      <span
        className={cn(
          "text-xs flex items-center gap-1",
          isEnabled ? "text-brand" : "text-muted-foreground opacity-40",
          labelClassName,
        )}
      >
        <Lock className="w-3 h-3" />
        Credentials
      </span>
      <input
        type="text"
        autoComplete="username"
        disabled={!isEnabled}
        value={credentials.username}
        onChange={(event) => onChange("username", event.target.value)}
        placeholder="Username"
        className={cn(
          FIELD_INPUT_CLASS,
          "disabled:opacity-40 disabled:cursor-not-allowed",
          usernameClassName,
        )}
      />
      <PasswordInput
        autoComplete="current-password"
        disabled={!isEnabled}
        value={credentials.password}
        onChange={(event) => onChange("password", event.target.value)}
        placeholder="Password"
        className={passwordClassName}
      />
    </>
  );
}
