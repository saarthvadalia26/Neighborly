"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CreatePostFields,
  CreatePostSubmitButton,
} from "@/components/create-post-fields";
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
import type { CreditPricingPost } from "@/lib/credit-guidance";

import { createPost } from "./actions";

export function PostCreateDialog({
  pricingPosts,
}: {
  pricingPosts: CreditPricingPost[];
}) {
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
          <CreatePostFields pricingPosts={pricingPosts} />

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
