"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithTransferMessage(
  postId: string,
  params: {
    action_error?: string;
    action_message?: string;
    transfer_error?: string;
    transferred?: string;
  },
): never {
  const searchParams = new URLSearchParams();

  if (params.action_error) {
    searchParams.set("action_error", params.action_error);
  }

  if (params.action_message) {
    searchParams.set("action_message", params.action_message);
  }

  if (params.transfer_error) {
    searchParams.set("transfer_error", params.transfer_error);
  }

  if (params.transferred) {
    searchParams.set("transferred", params.transferred);
  }

  redirect(`/dashboard/post/${postId}?${searchParams.toString()}`);
}

function redirectDashboardWithMessage(params: { message?: string }): never {
  const searchParams = new URLSearchParams();

  if (params.message) {
    searchParams.set("message", params.message);
  }

  redirect(`/dashboard?${searchParams.toString()}`);
}

export async function updatePostStatus(formData: FormData) {
  const postId = readString(formData, "post_id");
  const nextStatus = readString(formData, "status");

  if (!postId || !["open", "paused", "canceled"].includes(nextStatus)) {
    redirectWithTransferMessage(postId || "", {
      action_error: "Post status update details are incomplete.",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (postError || !post) {
    redirectWithTransferMessage(postId, {
      action_error: postError?.message ?? "Post not found.",
    });
  }

  if (post.status === "completed") {
    redirectWithTransferMessage(postId, {
      action_error: "Completed posts cannot be changed.",
    });
  }

  if (post.status === "canceled") {
    redirectWithTransferMessage(postId, {
      action_error: "Removed posts cannot be changed.",
    });
  }

  if (nextStatus === "open" && post.status !== "paused") {
    redirectWithTransferMessage(postId, {
      action_error: "Only paused posts can be resumed.",
    });
  }

  if (nextStatus === "paused" && post.status !== "open") {
    redirectWithTransferMessage(postId, {
      action_error: "Only available posts can be paused.",
    });
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update({ status: nextStatus as "open" | "paused" | "canceled" })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (updateError) {
    redirectWithTransferMessage(postId, { action_error: updateError.message });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/post/${postId}`);

  if (nextStatus === "canceled") {
    redirectDashboardWithMessage({ message: "Post removed." });
  }

  redirectWithTransferMessage(postId, {
    action_message:
      nextStatus === "paused" ? "Post paused." : "Post resumed.",
  });
}

export async function transferCredits(formData: FormData) {
  const postId = readString(formData, "post_id");
  const receiverId = readString(formData, "receiver_id");
  const amountValue = readString(formData, "amount");
  const amount = Number(amountValue);
  const taskCompletedConfirmed =
    readString(formData, "task_completed_confirmed") === "yes";

  if (
    !postId ||
    !receiverId ||
    !/^[1-5]$/.test(amountValue) ||
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > 5
  ) {
    redirectWithTransferMessage(postId || "", {
      transfer_error: "Agreed Credit amount must be from 1 to 5.",
    });
  }

  if (!taskCompletedConfirmed) {
    redirectWithTransferMessage(postId, {
      transfer_error: "Confirm the task is completed before paying Credits.",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("author_id, type, status")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    redirectWithTransferMessage(postId, {
      transfer_error: postError?.message ?? "Post not found.",
    });
  }

  if (post.type === "offer" && receiverId !== post.author_id) {
    redirectWithTransferMessage(postId, {
      transfer_error: "Offer payments must go to the post author.",
    });
  }

  if (post.status === "completed") {
    redirectWithTransferMessage(postId, {
      transfer_error: "This transaction is already completed.",
    });
  }

  if (post.status !== "open") {
    redirectWithTransferMessage(postId, {
      transfer_error: "Credits can only be paid while this swap is available.",
    });
  }

  if (post.type === "need" && user.id !== post.author_id) {
    redirectWithTransferMessage(postId, {
      transfer_error: "Only the person who posted this need can pay Credits.",
    });
  }

  if (post.type === "need" && receiverId === post.author_id) {
    redirectWithTransferMessage(postId, {
      transfer_error: "Choose the neighbor who completed your need.",
    });
  }

  const { error } = await supabase.rpc("transfer_credits", {
    sender_uuid: user.id,
    receiver_uuid: receiverId,
    transfer_amount: amount,
    related_post_id: postId,
  });

  if (error) {
    redirectWithTransferMessage(postId, { transfer_error: error.message });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/post/${postId}`);

  redirectWithTransferMessage(postId, {
    transferred:
      post?.type === "offer"
        ? `${amount} Credits paid. This offer stays available for other neighbors.`
        : `Need completed. ${amount} Credits paid to the neighbor who helped.`,
  });
}
