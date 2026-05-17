"use server";

import { redirect } from "next/navigation";

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

  const { error } = await supabase.rpc("delete_account");

  if (error) {
    redirectWithMessage({ error: error.message });
  }

  await supabase.auth.signOut();

  redirect("/login?message=Account deleted.");
}
