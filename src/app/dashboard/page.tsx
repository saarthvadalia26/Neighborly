import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, History, Settings } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastNotice } from "@/components/toast-notice";
import type { CreditPricingPost } from "@/lib/credit-guidance";
import { buildReviewStatsByProfile } from "@/lib/reviews";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { logout } from "../(auth)/actions";
import { PostsFeed, type FeedPost } from "./posts-feed";
import { PostCreateDialog } from "./post-create-dialog";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    create_error?: string;
    message?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  if (!hasSupabaseConfig()) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-5xl gap-8">
          <header className="border-b pb-5">
            <p className="text-sm font-medium text-muted-foreground">
              Community Swap
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Neighborhood feed
            </h1>
          </header>
          <Alert>
            <AlertTitle>Supabase is not configured yet</AlertTitle>
            <AlertDescription>
              Add your project URL and anon key to .env.local to enable auth,
              profile creation, and the live feed.
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

  const [profileResult, postsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, credit_balance")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("posts")
      .select(
        "id, author_id, type, title, description, credit_value, status, created_at",
      )
      .in("status", ["open", "paused", "completed"])
      .order("created_at", { ascending: false }),
  ]);
  const authorIds = Array.from(
    new Set((postsResult.data ?? []).map((post) => post.author_id)),
  );
  const { data: postAuthorReviews } = authorIds.length
    ? await supabase
        .from("reviews")
        .select("reviewee_id, rating")
        .in("reviewee_id", authorIds)
    : { data: [] };
  const reviewStatsByProfile = buildReviewStatsByProfile(
    postAuthorReviews ?? [],
  );

  const posts: FeedPost[] = (postsResult.data ?? []).map((post) => ({
    id: post.id,
    authorId: post.author_id,
    type: post.type,
    title: post.title,
    description: post.description,
    creditValue: post.credit_value ?? 1,
    status: post.status ?? "open",
    createdAt: post.created_at,
    authorRatingAverage:
      reviewStatsByProfile.get(post.author_id)?.average ?? null,
    authorReviewCount: reviewStatsByProfile.get(post.author_id)?.count ?? 0,
  }));
  const pricingPosts: CreditPricingPost[] = (postsResult.data ?? []).map(
    (post) => ({
      type: post.type,
      title: post.title,
      creditValue: post.credit_value,
    }),
  );
  const creditBalance = profileResult.data?.credit_balance ?? 0;
  const name = profileResult.data?.name ?? user.email ?? "Neighbor";

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              Community Swap
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                Marketplace
              </h1>
              <Badge variant="secondary" className="h-7 gap-1.5 px-3">
                <Coins className="size-4" />
                {creditBalance} Credits
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Signed in as {name}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <PostCreateDialog pricingPosts={pricingPosts} />
            <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
              <Link href="/dashboard/activity">
                <History className="size-4" />
                My activity
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
              <Link href="/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
            <form action={logout}>
              <SignOutButton />
            </form>
          </div>
        </header>

        {params.create_error ? (
          <ToastNotice
            variant="error"
            title="Post was not created"
            description={params.create_error}
          />
        ) : null}

        {params.message ? (
          <ToastNotice
            title={params.message === "Post created." ? "Post created" : "Done"}
            description={params.message}
          />
        ) : null}

        {profileResult.error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load profile</AlertTitle>
            <AlertDescription>{profileResult.error.message}</AlertDescription>
          </Alert>
        ) : null}

        {postsResult.error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load posts</AlertTitle>
            <AlertDescription>{postsResult.error.message}</AlertDescription>
          </Alert>
        ) : (
          <PostsFeed posts={posts} />
        )}
      </div>
    </main>
  );
}
