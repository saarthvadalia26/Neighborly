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
  params: { transfer_error?: string; transferred?: string },
): never {
  const searchParams = new URLSearchParams();

  if (params.transfer_error) {
    searchParams.set("transfer_error", params.transfer_error);
  }

  if (params.transferred) {
    searchParams.set("transferred", params.transferred);
  }

  redirect(`/dashboard/post/${postId}?${searchParams.toString()}`);
}

export async function transferCredits(formData: FormData) {
  const postId = readString(formData, "post_id");
  const receiverId = readString(formData, "receiver_id");
  const amount = Number.parseInt(readString(formData, "amount"), 10);
  const taskCompletedConfirmed =
    readString(formData, "task_completed_confirmed") === "yes";

  if (!postId || !receiverId || !Number.isInteger(amount) || amount < 1) {
    redirectWithTransferMessage(postId || "", {
      transfer_error: "Transfer details are incomplete.",
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

  const { data: post } = await supabase
    .from("posts")
    .select("type")
    .eq("id", postId)
    .maybeSingle();

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
        : `Task completed. ${amount} Credits transferred successfully.`,
  });
}
