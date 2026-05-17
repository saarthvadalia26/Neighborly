import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { DeleteAccountForm } from "./delete-account-form";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;

  if (!hasSupabaseConfig()) {
    return (
      <SettingsShell>
        <Alert>
          <AlertTitle>Supabase is not configured yet</AlertTitle>
          <AlertDescription>
            Add your project URL and anon key to use account settings.
          </AlertDescription>
        </Alert>
      </SettingsShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, credit_balance")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SettingsShell>
      {params.error ? (
        <Alert variant="destructive">
          <AlertTitle>Settings update failed</AlertTitle>
          <AlertDescription>{params.error}</AlertDescription>
        </Alert>
      ) : null}

      {params.message ? (
        <Alert>
          <AlertTitle>Settings updated</AlertTitle>
          <AlertDescription>{params.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Signed in as {profile?.username ?? user.email ?? "Neighbor"} with{" "}
            {profile?.credit_balance ?? 0} Credits.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            This anonymizes your profile, cancels your available posts, signs
            you out, and keeps past transactions for record keeping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </SettingsShell>
  );
}

function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <Button asChild variant="ghost" className="w-fit gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to marketplace
          </Link>
        </Button>
        <header className="grid gap-1 border-b pb-5">
          <p className="text-sm font-medium text-muted-foreground">
            Community Swap
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        </header>
        {children}
      </div>
    </main>
  );
}
