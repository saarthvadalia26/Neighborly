"use client";

import { useId, useState } from "react";
import { Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { transferCredits } from "./actions";

type CompletionPaymentFormProps = {
  postId: string;
  postType: "offer" | "need";
  amount: number;
} & (
  | {
      receiverId: string;
      receiverUsername: string;
      recipients?: never;
    }
  | {
      receiverId?: never;
      receiverUsername?: never;
      recipients: { id: string; username: string }[];
    }
);

export function CompletionPaymentForm({
  postId,
  postType,
  receiverId,
  receiverUsername,
  recipients,
  amount,
}: CompletionPaymentFormProps) {
  const confirmationId = useId();
  const recipientSelectId = useId();
  const [selectedReceiverId, setSelectedReceiverId] = useState(
    receiverId ?? recipients?.[0]?.id ?? "",
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const selectedReceiverUsername =
    receiverUsername ??
    recipients?.find((recipient) => recipient.id === selectedReceiverId)
      ?.username ??
    "this neighbor";

  if (postType === "need" && (!recipients || recipients.length === 0)) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
        When a neighbor messages you and completes this need, you can pay them
        Credits here.
      </div>
    );
  }

  return (
    <form action={transferCredits} className="grid w-full gap-3">
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="receiver_id" value={selectedReceiverId} />
      <input type="hidden" name="amount" value={amount} />

      {postType === "need" && recipients ? (
        <div className="grid gap-2">
          <Label htmlFor={recipientSelectId}>Who completed your need?</Label>
          <select
            id={recipientSelectId}
            value={selectedReceiverId}
            onChange={(event) => setSelectedReceiverId(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            required
          >
            {recipients.map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.username}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
          {selectedReceiverUsername}.
        </span>
      </Label>

      <Button
        type="submit"
        disabled={!isConfirmed || !selectedReceiverId}
        className="w-fit gap-2"
      >
        <Coins className="size-4" />
        Pay {amount} Credits to {selectedReceiverUsername}
      </Button>
    </form>
  );
}
