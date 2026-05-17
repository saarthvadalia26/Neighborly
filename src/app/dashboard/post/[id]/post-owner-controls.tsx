import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";

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
            <Button type="submit" variant="outline" className="gap-2">
              <PauseCircle className="size-4" />
              Pause
            </Button>
          </form>
        ) : null}

        {canResume ? (
          <form action={updatePostStatus}>
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="status" value="open" />
            <Button type="submit" className="gap-2">
              <PlayCircle className="size-4" />
              Resume
            </Button>
          </form>
        ) : null}

        <form action={updatePostStatus}>
          <input type="hidden" name="post_id" value={postId} />
          <input type="hidden" name="status" value="canceled" />
          <Button type="submit" variant="destructive" className="gap-2">
            <Trash2 className="size-4" />
            Remove
          </Button>
        </form>
      </div>
    </div>
  );
}
