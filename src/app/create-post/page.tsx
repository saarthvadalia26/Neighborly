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
import type { CreditPricingPost } from "@/lib/credit-guidance";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { CreatePostForm } from "./create-post-form";

export const dynamic = "force-dynamic";

export default async function CreatePostPage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-2xl gap-6">
          <Alert>
            <AlertTitle>Supabase is not configured yet</AlertTitle>
            <AlertDescription>
              Add your project URL and anon key to .env.local to create posts.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: pricingRows } = await supabase
    .from("posts")
    .select("type, title, credit_value")
    .in("status", ["open", "paused", "completed"])
    .order("created_at", { ascending: false })
    .limit(100);

  const pricingPosts: CreditPricingPost[] = (pricingRows ?? []).map((post) => ({
    type: post.type,
    title: post.title,
    creditValue: post.credit_value,
  }));

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-2xl gap-6">
        <Button asChild variant="ghost" className="w-fit gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to feed
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create a swap post</CardTitle>
            <CardDescription>
              Share an offer or need with your neighborhood marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreatePostForm pricingPosts={pricingPosts} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
