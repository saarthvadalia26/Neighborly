"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

export function AuthSubmitButton({
  label,
  pendingLabel,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full gap-2">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}
