"use client";

import {
  CreatePostFields,
  CreatePostSubmitButton,
} from "@/components/create-post-fields";
import type { CreditPricingPost } from "@/lib/credit-guidance";

import { createPost } from "../dashboard/actions";

export function CreatePostForm({
  pricingPosts,
}: {
  pricingPosts: CreditPricingPost[];
}) {
  return (
    <form action={createPost} className="grid gap-4">
      <CreatePostFields pricingPosts={pricingPosts} />
      <CreatePostSubmitButton className="w-fit" />
    </form>
  );
}
