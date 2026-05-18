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
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a swap post</DialogTitle>
          <DialogDescription>
            Share what you can offer or what you need from nearby members.
          </DialogDescription>
        </DialogHeader>

        <form
          action={createPost}
          className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4"
        >
          <div className="-mx-1 grid min-h-0 gap-4 overflow-y-auto px-1 pr-2">
            <CreatePostFields pricingPosts={pricingPosts} />
          </div>

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
