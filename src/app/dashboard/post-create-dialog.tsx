"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { createPost } from "./actions";

type PostType = "offer" | "need";

export function PostCreateDialog() {
  const [type, setType] = useState<PostType>("offer");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          New post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a swap post</DialogTitle>
          <DialogDescription>
            Share what you can offer or what you need from nearby members.
          </DialogDescription>
        </DialogHeader>

        <form action={createPost} className="grid gap-4">
          <PostCreateFormFields type={type} onTypeChange={setType} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <CreatePostSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PostCreateFormFields({
  type,
  onTypeChange,
}: {
  type: PostType;
  onTypeChange: (type: PostType) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-2">
        <Label>Post type</Label>
        <Tabs
          value={type}
          onValueChange={(value) => onTypeChange(value as PostType)}
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
      </div>
    </>
  );
}

function CreatePostSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "Creating..." : "Create post"}
    </Button>
  );
}
