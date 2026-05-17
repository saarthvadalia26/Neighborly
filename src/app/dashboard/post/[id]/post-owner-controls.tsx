"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, PauseCircle, PlayCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { updatePostStatus } from "./actions";

type PostOwnerControlsProps = {
  postId: string;
  status: "open" | "paused" | "in_progress" | "completed" | "canceled" | null;
};

export function PostOwnerControls({ postId, status }: PostOwnerControlsProps) {
  if (status === "completed" || status === "canceled") {
    return null;
  }

  const canPause = status === "open" || status === null;
  const canResume = status === "paused";

  return (
    <div className="grid gap-3">
      <div>
        <h2 className="text-sm font-medium">Post controls</h2>
        <p className="text-sm text-muted-foreground">
          Pause hides this post from neighbors until you resume it. Remove
          cancels the post.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canPause ? (
          <form action={updatePostStatus}>
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="status" value="paused" />
            <PostStatusSubmitButton action="pause" />
          </form>
        ) : null}

        {canResume ? (
          <form action={updatePostStatus}>
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="status" value="open" />
            <PostStatusSubmitButton action="resume" />
          </form>
        ) : null}

        <form action={updatePostStatus}>
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="status" value="canceled" />
          <PostStatusSubmitButton action="remove" />
        </form>
      </div>
    </div>
  );
}

function PostStatusSubmitButton({
  action,
}: {
  action: "pause" | "resume" | "remove";
}) {
  const { pending } = useFormStatus();

  if (action === "pause") {
    return (
      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        aria-busy={pending}
        className="gap-2"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <PauseCircle className="size-4" />
        )}
        {pending ? "Pausing..." : "Pause"}
      </Button>
    );
  }

  if (action === "resume") {
    return (
      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="gap-2"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <PlayCircle className="size-4" />
        )}
        {pending ? "Resuming..." : "Resume"}
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      aria-busy={pending}
      className="gap-2"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {pending ? "Removing..." : "Remove"}
    </Button>
  );
}
