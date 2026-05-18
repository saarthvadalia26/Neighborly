"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, PauseCircle, PlayCircle, Trash2 } from "lucide-react";

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
          <PostStatusConfirmation
            action="pause"
            postId={postId}
            nextStatus="paused"
          />
        ) : null}

        {canResume ? (
          <form action={updatePostStatus}>
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="status" value="open" />
            <PostStatusSubmitButton action="resume" />
          </form>
        ) : null}

        <PostStatusConfirmation
          action="remove"
          postId={postId}
          nextStatus="canceled"
        />
      </div>
    </div>
  );
}

function PostStatusConfirmation({
  action,
  postId,
  nextStatus,
}: {
  action: "pause" | "remove";
  postId: string;
  nextStatus: "paused" | "canceled";
}) {
  const isRemove = action === "remove";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={isRemove ? "destructive" : "outline"}
          className="gap-2"
        >
          {isRemove ? (
            <Trash2 className="size-4" />
          ) : (
            <PauseCircle className="size-4" />
          )}
          {isRemove ? "Remove post" : "Pause"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRemove ? "Remove this post?" : "Pause this post?"}
          </DialogTitle>
          <DialogDescription>
            {isRemove
              ? "This will cancel the post and remove it from active marketplace browsing. People who already participated can still see related activity."
              : "This will hide the post from neighbors until you resume it."}
          </DialogDescription>
        </DialogHeader>

        <form action={updatePostStatus}>
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="status" value={nextStatus} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <PostStatusSubmitButton action={action} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
