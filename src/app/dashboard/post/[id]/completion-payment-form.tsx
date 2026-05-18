"use client";

import { useId, useState } from "react";
import { Coins, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { transferCredits } from "./actions";

type CompletionPaymentFormProps = {
  postId: string;
  postType: "offer" | "need";
  amount: number;
} & (
  | {
      receiverId: string;
      receiverName: string;
      recipients?: never;
    }
  | {
      receiverId?: never;
      receiverName?: never;
      recipients: { id: string; name: string }[];
    }
);

export function CompletionPaymentForm({
  postId,
  postType,
  receiverId,
  receiverName,
  recipients,
  amount,
}: CompletionPaymentFormProps) {
  const confirmationId = useId();
  const amountInputId = useId();
  const recipientSelectId = useId();
  const [selectedReceiverId, setSelectedReceiverId] = useState(
    receiverId ?? recipients?.[0]?.id ?? "",
  );
  const [agreedAmountInput, setAgreedAmountInput] = useState(String(amount));
  const [isConfirmed, setIsConfirmed] = useState(false);
  const isAgreedAmountValid = /^[1-5]$/.test(agreedAmountInput.trim());
  const agreedAmountLabel = isAgreedAmountValid
    ? String(Number(agreedAmountInput))
    : "";
  const confirmationAmountText = isAgreedAmountValid
    ? `${agreedAmountLabel} Credits`
    : "the agreed amount";
  const selectedReceiverName =
    receiverName ??
    recipients?.find((recipient) => recipient.id === selectedReceiverId)
      ?.name ??
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
                {recipient.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={amountInputId}>Agreed Credit amount</Label>
        <Input
          id={amountInputId}
          name="amount"
          type="number"
          min={1}
          max={5}
          step={1}
          inputMode="numeric"
          value={agreedAmountInput}
          onChange={(event) => setAgreedAmountInput(event.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Listed at {amount} Credits. Enter the amount you both agreed on in
          chat.
        </p>
      </div>

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
          {confirmationAmountText} to {selectedReceiverName}.
        </span>
      </Label>

      <PaymentSubmitButton
        amountLabel={agreedAmountLabel}
        disabled={!isConfirmed || !selectedReceiverId || !isAgreedAmountValid}
        receiverName={selectedReceiverName}
      />
    </form>
  );
}

function PaymentSubmitButton({
  amountLabel,
  disabled,
  receiverName,
}: {
  amountLabel: string;
  disabled: boolean;
  receiverName: string;
}) {
  const { pending } = useFormStatus();
  const buttonLabel =
    !amountLabel
      ? "Enter 1-5 Credits"
      : pending
        ? `Paying ${amountLabel} Credits...`
        : `Pay ${amountLabel} Credits to ${receiverName}`;

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      aria-live="polite"
      className="w-fit min-w-56 gap-2"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Coins aria-hidden="true" className="size-4" />
      )}
      <span>{buttonLabel}</span>
    </Button>
  );
}
