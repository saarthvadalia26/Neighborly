import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Coins, Star } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastNotice } from "@/components/toast-notice";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { formatRating, summarizeReviews } from "@/lib/reviews";

import { CompletionPaymentForm } from "./completion-payment-form";
import { PostOwnerControls } from "./post-owner-controls";
import { PostChat, type ChatMessage, type ChatParticipant } from "./post-chat";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    action_error?: string;
    action_message?: string;
    review_error?: string;
    reviewed?: string;
    transfer_error?: string;
    transferred?: string;
  }>;
};

type ReviewPreview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  reviewer_id: string;
};

export default async function PostDetailPage({
  params,
  searchParams,
}: PostDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  if (!hasSupabaseConfig()) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-4xl gap-6">
          <Alert>
            <AlertTitle>Supabase is not configured yet</AlertTitle>
            <AlertDescription>
              Add your project URL and anon key to .env.local to view posts.
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

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, author_id, type, title, description, credit_value, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (postError) {
    return (
      <PostDetailShell>
        <Alert variant="destructive">
          <AlertTitle>Could not load post</AlertTitle>
          <AlertDescription>{postError.message}</AlertDescription>
        </Alert>
      </PostDetailShell>
    );
  }

  if (!post) {
    notFound();
  }

  const [
    { data: author },
    { data: messages, error: messagesError },
    { data: authorReviews },
    { data: reviewTransactions },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name")
      .eq("id", post.author_id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, post_id, sender_id, receiver_id, content, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer_id")
      .eq("reviewee_id", post.author_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("id, post_id, sender_id, receiver_id, status, created_at")
      .eq("post_id", post.id)
      .eq("sender_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
  ]);
  const reviewTransactionIds = (reviewTransactions ?? []).map(
    (transaction) => transaction.id,
  );
  const { data: submittedReviews } = reviewTransactionIds.length
    ? await supabase
        .from("reviews")
        .select("transaction_id")
        .in("transaction_id", reviewTransactionIds)
    : { data: [] };

  const profileIds = Array.from(
    new Set(
      (messages ?? [])
        .flatMap((message) => [message.sender_id, message.receiver_id])
        .concat([post.author_id, user.id])
        .concat((authorReviews ?? []).map((review) => review.reviewer_id))
        .concat(
          (reviewTransactions ?? []).map(
            (transaction) => transaction.receiver_id,
          ),
        ),
    ),
  );
  const { data: messageProfiles } = profileIds.length
    ? await supabase.from("profiles").select("id, name").in("id", profileIds)
    : { data: [] };
  const nameById = new Map(
    (messageProfiles ?? []).map((profile) => [profile.id, profile.name]),
  );
  const authorName = author?.name ?? nameById.get(post.author_id) ?? "Neighbor";
  const isAuthor = user.id === post.author_id;
  const chatParticipants: ChatParticipant[] = isAuthor
    ? Array.from(
        new Set(
          (messages ?? [])
            .flatMap((message) => [message.sender_id, message.receiver_id])
            .filter((profileId) => profileId !== post.author_id),
        ),
      ).map((profileId) => ({
        id: profileId,
        name: nameById.get(profileId) ?? "Neighbor",
      }))
    : [{ id: post.author_id, name: authorName }];
  const chatMessages: ChatMessage[] = (messages ?? []).map((message) => ({
    id: message.id,
    postId: message.post_id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    content: message.content,
    createdAt: message.created_at,
    senderName:
      message.sender_id === user.id
        ? "You"
        : nameById.get(message.sender_id) ?? "Neighbor",
  }));
  const creditValue = post.credit_value ?? 1;
  const isCompleted = post.status === "completed";
  const shouldShowPaymentArea =
    (post.type === "offer" && !isAuthor) || (post.type === "need" && isAuthor);
  const shouldShowOwnerControls =
    isAuthor && post.status !== "completed" && post.status !== "canceled";
  const authorReviewSummary = summarizeReviews(authorReviews ?? []);
  const reviewedTransactionIds = new Set(
    (submittedReviews ?? []).map((review) => review.transaction_id),
  );
  const reviewableTransaction = (reviewTransactions ?? []).find(
    (transaction) => !reviewedTransactionIds.has(transaction.id),
  );
  const revieweeName = reviewableTransaction
    ? nameById.get(reviewableTransaction.receiver_id) ?? "this neighbor"
    : "";

  return (
    <PostDetailShell>
      {query.transfer_error ? (
        <ToastNotice
          variant="error"
          title="Transfer failed"
          description={query.transfer_error}
        />
      ) : null}

      {query.transferred ? (
        <ToastNotice
          title="Credits transferred"
          description={query.transferred}
        />
      ) : null}

      {query.action_error ? (
        <ToastNotice
          variant="error"
          title="Post update failed"
          description={query.action_error}
        />
      ) : null}

      {query.action_message ? (
        <ToastNotice title="Post updated" description={query.action_message} />
      ) : null}

      {query.review_error ? (
        <ToastNotice
          variant="error"
          title="Review failed"
          description={query.review_error}
        />
      ) : null}

      {query.reviewed ? (
        <ToastNotice title="Review posted" description={query.reviewed} />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={post.type === "offer" ? "default" : "outline"}>
                  {post.type === "offer" ? "Offer" : "Need"}
                </Badge>
                <Badge variant="secondary">{formatStatus(post.status)}</Badge>
              </div>
              <CardTitle className="text-2xl">{post.title}</CardTitle>
              <CardDescription className="grid gap-1">
                <span>
                  Posted by {authorName} on {formatPostDate(post.created_at)}
                </span>
                <ProfileRating
                  average={authorReviewSummary.average}
                  count={authorReviewSummary.count}
                />
              </CardDescription>
            </div>
            <Badge variant="secondary" className="h-8 gap-1.5 px-3">
              <Coins className="size-4" />
              {creditValue} Credits
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
            {post.description}
          </p>
        </CardContent>
        {shouldShowOwnerControls ? (
          <CardFooter>
            <PostOwnerControls postId={post.id} status={post.status} />
          </CardFooter>
        ) : null}
        {shouldShowPaymentArea ? (
          <CardFooter className="grid gap-3">
            {isCompleted ? (
              <Badge variant="secondary" className="h-8 w-fit gap-1.5 px-3">
                <CheckCircle2 className="size-4" />
                Transaction Completed
              </Badge>
            ) : post.status === "open" ? (
              post.type === "offer" ? (
                <CompletionPaymentForm
                  postId={post.id}
                  postType="offer"
                  receiverId={post.author_id}
                  receiverName={authorName}
                  amount={creditValue}
                />
              ) : (
                <CompletionPaymentForm
                  postId={post.id}
                  postType="need"
                  recipients={chatParticipants}
                  amount={creditValue}
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Credits can only be paid while this swap is available.
              </p>
            )}
          </CardFooter>
        ) : null}
      </Card>

      {reviewableTransaction ? (
        <ReviewForm
          postId={post.id}
          transactionId={reviewableTransaction.id}
          revieweeName={revieweeName}
        />
      ) : null}

      <ReviewsCard
        authorName={authorName}
        reviews={authorReviews ?? []}
        nameById={nameById}
      />

      {messagesError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load messages</AlertTitle>
          <AlertDescription>{messagesError.message}</AlertDescription>
        </Alert>
      ) : (
        <PostChat
          postId={post.id}
          authorId={post.author_id}
          authorName={authorName}
          currentUserId={user.id}
          initialMessages={chatMessages}
          isThreadClosed={isCompleted}
          isAuthor={isAuthor}
          participants={chatParticipants}
        />
      )}
    </PostDetailShell>
  );
}

function ProfileRating({
  average,
  count,
}: {
  average: number | null;
  count: number;
}) {
  if (!average || count === 0) {
    return <span>No reviews yet</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-3.5 fill-foreground text-foreground" />
      {formatRating(average)} from {count} {count === 1 ? "review" : "reviews"}
    </span>
  );
}

function ReviewsCard({
  authorName,
  reviews,
  nameById,
}: {
  authorName: string;
  reviews: ReviewPreview[];
  nameById: Map<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews for {authorName}</CardTitle>
        <CardDescription>
          Recent feedback from completed swaps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
          <div className="grid gap-4">
            {reviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="grid gap-1 border-b pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary" className="gap-1">
                    <Star className="size-3 fill-foreground text-foreground" />
                    {review.rating}
                  </Badge>
                  <span className="font-medium">
                    {nameById.get(review.reviewer_id) ?? "Neighbor"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatReviewDate(review.created_at)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {review.comment}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Completed swaps will build this reputation over
            time.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PostDetailShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
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

function formatPostDate(value: string | null) {
  if (!value) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatReviewDate(value: string | null) {
  if (!value) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatStatus(value: string | null) {
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
