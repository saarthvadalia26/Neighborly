import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Coins, History, MinusCircle, PlusCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

export const dynamic = "force-dynamic";

type ActivityPost = {
  id: string;
  type: "offer" | "need";
  title: string;
  credit_value: number | null;
  status: "open" | "paused" | "in_progress" | "completed" | "canceled" | null;
  created_at: string | null;
};

type ActivityTransaction = {
  id: string;
  post_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  status: "pending" | "completed" | "disputed" | null;
  created_at: string | null;
};

export default async function ActivityPage() {
  if (!hasSupabaseConfig()) {
    return (
      <ActivityShell>
        <Alert>
          <AlertTitle>Supabase is not configured yet</AlertTitle>
          <AlertDescription>
            Add your project URL and anon key to view account activity.
          </AlertDescription>
        </Alert>
      </ActivityShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profileResult, postsResult, transactionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, credit_balance")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id, type, title, credit_value, status, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("id, post_id, sender_id, receiver_id, amount, status, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
  ]);

  const transactions = (transactionsResult.data ?? []) as ActivityTransaction[];
  const relatedPostIds = Array.from(
    new Set(transactions.map((transaction) => transaction.post_id)),
  );
  const relatedProfileIds = Array.from(
    new Set(
      transactions.flatMap((transaction) => [
        transaction.sender_id,
        transaction.receiver_id,
      ]),
    ),
  );
  const [{ data: relatedPosts }, { data: relatedProfiles }] =
    await Promise.all([
      relatedPostIds.length > 0
        ? supabase
            .from("posts")
            .select("id, type, title")
            .in("id", relatedPostIds)
        : Promise.resolve({ data: [] }),
      relatedProfileIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, name")
            .in("id", relatedProfileIds)
        : Promise.resolve({ data: [] }),
    ]);
  const postById = new Map(
    (relatedPosts ?? []).map((post) => [
      post.id,
      { title: post.title, type: post.type },
    ]),
  );
  const nameById = new Map(
    (relatedProfiles ?? []).map((profile) => [profile.id, profile.name]),
  );
  const profile = profileResult.data;
  const posts = (postsResult.data ?? []) as ActivityPost[];

  return (
    <ActivityShell>
      <header className="grid gap-2 border-b pb-5">
        <p className="text-sm font-medium text-muted-foreground">
          Neighborly
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            My activity
          </h1>
          <Badge variant="secondary" className="h-7 gap-1.5 px-3">
            <Coins className="size-4" />
            {profile?.credit_balance ?? 0} Credits
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Signed in as {profile?.name ?? user.email ?? "Neighbor"}
        </p>
      </header>

      {profileResult.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>{profileResult.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {postsResult.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load your posts</AlertTitle>
          <AlertDescription>{postsResult.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {transactionsResult.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load transactions</AlertTitle>
          <AlertDescription>{transactionsResult.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>My Posts</CardTitle>
            <CardDescription>
              Offers and needs you have created in the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/post/${post.id}`}
                  className="grid gap-2 rounded-lg border p-3 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Posted {formatDate(post.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Badge
                        variant={post.type === "offer" ? "default" : "outline"}
                      >
                        {post.type === "offer" ? "Offer" : "Need"}
                      </Badge>
                      <Badge variant="secondary">
                        {formatStatus(post.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Credit value</span>
                    <Badge variant="secondary" className="gap-1">
                      <Coins className="size-3" />
                      {post.credit_value ?? 1}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyActivityState
                title="No posts yet"
                description="Create your first offer or need to start swapping with nearby neighbors."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Credits you have earned or spent after completed swaps.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {transactions.length > 0 ? (
              transactions.map((transaction) => {
                const isEarned = transaction.receiver_id === user.id;
                const otherProfileId = isEarned
                  ? transaction.sender_id
                  : transaction.receiver_id;
                const otherName = nameById.get(otherProfileId) ?? "Neighbor";
                const post = postById.get(transaction.post_id);

                return (
                  <div
                    key={transaction.id}
                    className="grid gap-2 rounded-lg border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {post?.title ?? "Swap transaction"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isEarned ? "Earned from" : "Paid to"}{" "}
                          {otherName} on {formatDate(transaction.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={isEarned ? "default" : "outline"}
                        className="h-7 gap-1.5 px-3"
                      >
                        {isEarned ? (
                          <PlusCircle className="size-3" />
                        ) : (
                          <MinusCircle className="size-3" />
                        )}
                        {isEarned ? "+" : "-"}
                        {transaction.amount} Credits
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post?.type ? (
                        <Badge
                          variant={post.type === "offer" ? "default" : "outline"}
                        >
                          {post.type === "offer" ? "Offer" : "Need"}
                        </Badge>
                      ) : null}
                      <Badge variant="secondary">
                        {formatTransactionStatus(transaction.status)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyActivityState
                title="No transactions yet"
                description="Completed swaps will appear here once Credits move between neighbors."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ActivityShell>
  );
}

function ActivityShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <Button asChild variant="ghost" className="w-fit gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to marketplace
          </Link>
        </Button>
        {children}
      </div>
    </main>
  );
}

function EmptyActivityState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-36 place-items-center rounded-lg border border-dashed bg-muted/20 p-4 text-center">
      <div className="grid max-w-sm gap-2">
        <History className="mx-auto size-5 text-muted-foreground" />
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(value: ActivityPost["status"]) {
  switch (value) {
    case "open":
    case null:
      return "Available";
    case "paused":
      return "Paused";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "canceled":
      return "Canceled";
    default:
      return "Available";
  }
}

function formatTransactionStatus(value: ActivityTransaction["status"]) {
  switch (value) {
    case "pending":
    case null:
      return "Pending";
    case "completed":
      return "Completed";
    case "disputed":
      return "Disputed";
    default:
      return "Pending";
  }
}
