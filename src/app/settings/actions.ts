"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithMessage(params: { error?: string; message?: string }): never {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.message) {
    searchParams.set("message", params.message);
  }

  redirect(`/settings?${searchParams.toString()}`);
}

async function deleteAccountRows(userId: string) {
  const admin = createAdminClient();

  const { data: authoredPosts, error: postsError } = await admin
    .from("posts")
    .select("id")
    .eq("author_id", userId);

  if (postsError) {
    return postsError;
  }

  const authoredPostIds = authoredPosts?.map((post) => post.id) ?? [];

  if (authoredPostIds.length > 0) {
    const { error: postMessagesError } = await admin
      .from("messages")
      .delete()
      .in("post_id", authoredPostIds);

    if (postMessagesError) {
      return postMessagesError;
    }

    const { error: postTransactionsError } = await admin
      .from("transactions")
      .delete()
      .in("post_id", authoredPostIds);

    if (postTransactionsError) {
      return postTransactionsError;
    }
  }

  const participantFilter = `sender_id.eq.${userId},receiver_id.eq.${userId}`;

  const { error: userMessagesError } = await admin
    .from("messages")
    .delete()
    .or(participantFilter);

  if (userMessagesError) {
    return userMessagesError;
  }

  const { error: userTransactionsError } = await admin
    .from("transactions")
    .delete()
    .or(participantFilter);

  if (userTransactionsError) {
    return userTransactionsError;
  }

  const { error: userPostsError } = await admin
    .from("posts")
    .delete()
    .eq("author_id", userId);

  if (userPostsError) {
    return userPostsError;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    return profileError;
  }

  const { error: authUserError } = await admin.auth.admin.deleteUser(
    userId,
    false,
  );

  return authUserError;
}

export async function deleteAccount(formData: FormData) {
  const confirmation = readString(formData, "confirmation");

  if (confirmation !== "DELETE") {
    redirectWithMessage({
      error: "Type DELETE to confirm account deletion.",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasSupabaseAdminConfig()) {
    redirectWithMessage({
      error:
        "Missing SUPABASE_SERVICE_ROLE_KEY. Add your Supabase service role key to the server environment before deleting accounts.",
    });
  }

  const error = await deleteAccountRows(user.id);

  if (error) {
    redirectWithMessage({ error: error.message });
  }

  await supabase.auth.signOut();

  redirect("/login?message=Account deleted.");
}
