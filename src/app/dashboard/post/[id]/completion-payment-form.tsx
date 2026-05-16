"use client";

import { useId, useState } from "react";
import { Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { transferCredits } from "./actions";

type CompletionPaymentFormProps = {
  postId: string;
  receiverId: string;
  receiverUsername: string;
  amount: number;
};

export function CompletionPaymentForm({
  postId,
  receiverId,
  receiverUsername,
  amount,
}: CompletionPaymentFormProps) {
  const confirmationId = useId();
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <form action={transferCredits} className="grid w-full gap-3">
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="receiver_id" value={receiverId} />
      <input type="hidden" name="amount" value={amount} />

      <Label
        htmlFor={confirmationId}
        className="items-start gap-3 rounded-lg border bg-muted/30 p-3 leading-6"
      >
        <input
          id={confirmationId}
          name="task_completed_confirmed"
          type="checkbox"
          value="yes"
          checked={isConfirmed}
          required
          onChange={(event) => setIsConfirmed(event.target.checked)}
          className="mt-1 size-4 accent-primary"
        />
        <span>
          I confirm the task is completed and I am ready to pay{" "}
          {receiverUsername}.
        </span>
      </Label>

      <Button type="submit" disabled={!isConfirmed} className="w-fit gap-2">
        <Coins className="size-4" />
        Pay {amount} Credits to {receiverUsername}
      </Button>
    </form>
  );
}
