"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { createReview } from "./actions";

export function ReviewForm({
  postId,
  transactionId,
  revieweeName,
}: {
  postId: string;
  transactionId: string;
  revieweeName: string;
}) {
  const ratingLabelId = useId();
  const commentId = useId();
  const [rating, setRating] = useState(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review {revieweeName}</CardTitle>
        <CardDescription>
          Help nearby members understand what it was like to complete this swap.
        </CardDescription>
      </CardHeader>
      <form action={createReview}>
        <CardContent className="grid gap-4">
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="transaction_id" value={transactionId} />
          <input type="hidden" name="rating" value={rating} />

          <div className="grid gap-2">
            <Label id={ratingLabelId}>Rating</Label>
            <div
              aria-labelledby={ratingLabelId}
              className="flex flex-wrap gap-2"
              role="radiogroup"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={value <= rating ? "default" : "outline"}
                  size="icon"
                  aria-checked={rating === value}
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  role="radio"
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={cn(
                      "size-4",
                      value <= rating ? "fill-current" : null,
                    )}
                  />
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={commentId}>Comment</Label>
            <Textarea
              id={commentId}
              name="comment"
              maxLength={500}
              placeholder="Friendly, reliable, quick to communicate..."
            />
          </div>
        </CardContent>
        <CardFooter>
          <ReviewSubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}

function ReviewSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-fit gap-2">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "Posting review..." : "Post review"}
    </Button>
  );
}
