"use client";

import { useState } from "react";
import { uploadPostImage } from "@/lib/supabase/storage";
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
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setErrorMsg("");
    const file = formData.get("image_file") as File | null;

    if (file && file.size > 0) {
      try {
        const imageUrl = await uploadPostImage(file);
        formData.set("image_url", imageUrl);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "Image upload failed.",
        );
        return;
      }
    }

    try {
      const result = await createPost(formData);
      if (result && result.error) {
        setErrorMsg(result.error);
      }
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-4">
      {errorMsg && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
          {errorMsg}
        </div>
      )}
      <CreatePostFields pricingPosts={pricingPosts} />
      <CreatePostSubmitButton className="w-fit" />
    </form>
  );
}

