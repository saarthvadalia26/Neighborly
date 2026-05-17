"use client";

import { LogOut, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      aria-busy={pending}
      aria-live="polite"
      className="w-full min-w-28 gap-2 sm:w-auto"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <LogOut aria-hidden="true" className="size-4" />
      )}
      <span>{pending ? "Signing out..." : "Sign out"}</span>
    </Button>
  );
}
