"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { deleteAccount } from "./actions";

export function DeleteAccountForm() {
  return (
    <form action={deleteAccount} className="grid max-w-md gap-4">
      <DeleteAccountFields />
    </form>
  );
}

function DeleteAccountFields() {
  const { pending } = useFormStatus();

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="confirmation">Type DELETE to confirm</Label>
        <Input
          id="confirmation"
          name="confirmation"
          autoComplete="off"
          placeholder="DELETE"
          disabled={pending}
          required
        />
      </div>
      <Button
        type="submit"
        variant="destructive"
        disabled={pending}
        aria-busy={pending}
        className="w-fit gap-2"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
        {pending ? "Deleting..." : "Delete account"}
      </Button>
    </>
  );
}
