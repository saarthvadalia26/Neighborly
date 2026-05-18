"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithMessage(
  path: string,
  params: { error?: string; message?: string },
): never {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.message) {
    searchParams.set("message", params.message);
  }

  redirect(`${path}?${searchParams.toString()}`);
}

export async function login(formData: FormData) {
  const email = readString(formData, "email");
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    redirectWithMessage("/login", {
      error: "Email and password are required.",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithMessage("/login", { error: error.message });
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = readString(formData, "email");
  const name = readString(formData, "name");
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !name || !password) {
    redirectWithMessage("/signup", {
      error: "Name, email, and password are required.",
    });
  }

  if (name.length < 2 || name.length > 60) {
    redirectWithMessage("/signup", {
      error: "Name must be between 2 and 60 characters.",
    });
  }

  if (password.length < 6) {
    redirectWithMessage("/signup", {
      error: "Password must be at least 6 characters.",
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    redirectWithMessage("/signup", { error: error.message });
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirectWithMessage("/login", {
    message: "Account created. Check your email if confirmation is enabled, then sign in.",
  });
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
