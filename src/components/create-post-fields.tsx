"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Coins, LoaderCircle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CREDIT_VALUE_GUIDE,
  getCreditSuggestion,
  type CreditPricingPost,
  type CreditSuggestion,
  type PostType,
} from "@/lib/credit-guidance";
import { cn } from "@/lib/utils";

type CreatePostFieldsProps = {
  pricingPosts: CreditPricingPost[];
};

export function CreatePostFields({ pricingPosts }: CreatePostFieldsProps) {
  const [type, setType] = useState<PostType>("offer");
  const [title, setTitle] = useState("");
  const { pending } = useFormStatus();
  const suggestion = useMemo(
    () => getCreditSuggestion(pricingPosts, type, title),
    [pricingPosts, title, type],
  );

  return (
    <>
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-2">
        <Label>Post type</Label>
        <Tabs
          value={type}
          onValueChange={(value) => setType(value as PostType)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offer" disabled={pending}>
              Offer
            </TabsTrigger>
            <TabsTrigger value="need" disabled={pending}>
              Need
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          minLength={3}
          maxLength={100}
          placeholder="Bike tune-up, moving boxes, math tutoring..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={pending}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          minLength={10}
          maxLength={1000}
          placeholder="Add enough detail for a neighbor to understand the swap."
          disabled={pending}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="credit_value">Credit value</Label>
        <Input
          id="credit_value"
          name="credit_value"
          type="number"
          min={1}
          max={5}
          defaultValue={1}
          disabled={pending}
          required
        />
        <CreditValueGuide suggestion={suggestion} />
      </div>
    </>
  );
}

export function CreatePostSubmitButton({
  className,
}: {
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={cn("gap-2", className)}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "Creating..." : "Create post"}
    </Button>
  );
}

function CreditValueGuide({
  suggestion,
}: {
  suggestion: CreditSuggestion | null;
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm">
      {suggestion ? (
        <div className="flex items-start gap-2 text-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-medium">
              {suggestion.sampleSize > 1
                ? `Similar posts usually use ${suggestion.value} Credits.`
                : `A similar post used ${suggestion.value} Credits.`}
            </span>{" "}
            Based on {suggestion.sampleSize} older{" "}
            {suggestion.sampleSize === 1 ? "swap" : "swaps"} with matching
            title words.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-muted-foreground">
          <Coins className="mt-0.5 size-4 shrink-0" />
          <p>
            No close match yet. Use the scale below; neighbors can still
            message and agree before payment.
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-5">
        {CREDIT_VALUE_GUIDE.map((item) => (
          <div
            key={item.value}
            className="min-w-0 rounded-md border bg-background px-2 py-2"
          >
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="h-5 px-1.5">
                {item.value}
              </Badge>
              <span className="truncate text-xs font-medium">
                {item.label}
              </span>
            </div>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
