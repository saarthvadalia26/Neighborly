"use client";

import Link from "next/link";
import Image from "next/image";
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Coins, Search, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildReviewStatsByProfile, formatRating } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/browser";

const MotionTabsTrigger = motion(TabsTrigger);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export type FeedPost = {
  id: string;
  authorId: string;
  type: "offer" | "need";
  title: string;
  description: string;
  creditValue: number;
  imageUrl: string | null;
  category: string;
  status: "open" | "paused" | "in_progress" | "completed" | "canceled";
  createdAt: string | null;
  authorRatingAverage: number | null;
  authorReviewCount: number;
};

type TypeFilter = "all" | "offer" | "need";
type StatusFilter = "all" | "open" | "paused" | "completed";

type PostsFeedProps = {
  posts: FeedPost[];
};

type FeedPostRow = {
  id: string;
  author_id: string;
  type: "offer" | "need";
  title: string;
  description: string;
  credit_value: number | null;
  image_url: string | null;
  category: string;
  status: FeedPost["status"] | null;
  created_at: string | null;
};

const POST_REFRESH_INTERVAL_MS = 5000;

const feedNouns: Record<TypeFilter, string> = {
  all: "swaps",
  offer: "offers",
  need: "needs",
};

const statusLabels: Record<FeedPost["status"], string> = {
  open: "Available",
  paused: "Paused",
  in_progress: "In progress",
  completed: "Completed",
  canceled: "Canceled",
};

export function PostsFeed({ posts }: PostsFeedProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";
  const refreshInFlightRef = useRef(false);
  const feedSignatureRef = useRef(getFeedSignature(posts));
  const [livePosts, setLivePosts] = useState(posts);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const refreshPosts = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;

    try {
      let query = supabase
        .from("posts")
        .select(
          "id, author_id, type, title, description, credit_value, status, created_at, image_url, category",
        )
        .in("status", ["open", "paused", "completed"])
        .order("created_at", { ascending: false });

      if (currentCategory !== "all") {
        query = query.eq("category", currentCategory);
      }

      const { data, error } = await query;

      if (error || !data) {
        return;
      }

      const authorIds = Array.from(new Set(data.map((post) => post.author_id)));
      const { data: reviews } = authorIds.length
        ? await supabase
            .from("reviews")
            .select("reviewee_id, rating")
            .in("reviewee_id", authorIds)
        : { data: [] };
      const reviewStatsByProfile = buildReviewStatsByProfile(reviews ?? []);
      const nextPosts = data.map((post) =>
        mapFeedPost(post, reviewStatsByProfile),
      );
      const nextFeedSignature = getFeedSignature(nextPosts);

      if (feedSignatureRef.current !== nextFeedSignature) {
        feedSignatureRef.current = nextFeedSignature;
        setLivePosts(nextPosts);
      }
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [supabase, currentCategory]);

  const handleCategoryChange = useCallback((category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.push(`/dashboard?${params.toString()}`);
  }, [router, searchParams]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return livePosts.filter(
      (post) =>
        (typeFilter === "all" || post.type === typeFilter) &&
        (statusFilter === "all" || post.status === statusFilter) &&
        post.title.toLowerCase().includes(normalizedQuery),
    );
  }, [deferredQuery, livePosts, statusFilter, typeFilter]);
  const activePostsCount = livePosts.filter(
    (post) => post.status === "open",
  ).length;

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          void refreshPosts();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshPosts, supabase]);

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshPosts();
      }
    }, POST_REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshPosts();
      }
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshPosts]);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Swaps</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {filteredPosts.length} {feedNouns[typeFilter]} shown
            </span>
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,320px)_auto_auto_auto] xl:items-center">
          <label className="relative">
            <span className="sr-only">Search posts by title</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-8"
              placeholder="Search by title"
            />
          </label>
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <TabsList>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="all">All statuses</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="open">Available</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="paused">Paused</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="completed">Completed</MotionTabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <TabsList>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="all">All types</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="offer">Offers</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="need">Needs</MotionTabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            value={currentCategory}
            onValueChange={handleCategoryChange}
          >
            <TabsList>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="all">All Categories</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="items">Items</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="services">Services</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="errands">Errands</MotionTabsTrigger>
              <MotionTabsTrigger whileTap={{ scale: 0.95 }} value="other">Other</MotionTabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activePostsCount === 0 && livePosts.length > 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardHeader>
            <CardTitle>No active swaps right now</CardTitle>
            <CardDescription>
              The marketplace only has paused or completed posts at the moment.
              Start a fresh need or offer when you are ready.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {filteredPosts.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2"
        >
          {filteredPosts.map((post) => (
            <PostCardLink key={post.id} post={post} />
          ))}
        </motion.div>
      ) : (
        <EmptyFeedState
          hasAnyPosts={livePosts.length > 0}
          typeFilter={typeFilter}
        />
      )}
    </section>
  );
}

const PostCardLink = memo(function PostCardLink({ post }: { post: FeedPost }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/dashboard/post/${post.id}`}
        className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Card className="min-h-44 transition-all hover:bg-muted/30 hover:shadow-md">
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {post.description}
            </CardDescription>
            <CardAction>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge variant={post.type === "offer" ? "default" : "outline"}>
                  {post.type === "offer" ? "Offer" : "Need"}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {post.category}
                </Badge>
                <Badge
                  variant={
                    post.status === "completed" ? "secondary" : "outline"
                  }
                >
                  {statusLabels[post.status]}
                </Badge>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm text-muted-foreground">
            <span>Posted {formatPostDate(post.createdAt)}</span>
            <AuthorRating
              average={post.authorRatingAverage}
              count={post.authorReviewCount}
            />
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-sm text-muted-foreground">Credit value</span>
            <Badge variant="secondary" className="gap-1">
              <Coins className="size-3" />
              {post.creditValue}
            </Badge>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
});

function EmptyFeedState({
  hasAnyPosts,
  typeFilter,
}: {
  hasAnyPosts: boolean;
  typeFilter: TypeFilter;
}) {
  const title = hasAnyPosts
    ? `No ${feedNouns[typeFilter]} match these filters`
    : typeFilter === "need"
      ? "No requests in your area yet"
      : typeFilter === "offer"
        ? "No offers in your area yet"
        : "No active swaps in your area yet";
  const description = hasAnyPosts
    ? "Try another search or change the filters to widen the marketplace."
    : typeFilter === "need"
      ? "Be the first to post a need and let nearby neighbors know how they can help."
      : typeFilter === "offer"
        ? "Be the first to offer a useful skill, tool, or errand to nearby neighbors."
        : "Be the first to post a need or offer and get the neighborhood moving.";

  return (
    <Card className="bg-muted/20 text-center">
      <CardHeader className="mx-auto max-w-md">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function AuthorRating({
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

function mapFeedPost(
  post: FeedPostRow,
  reviewStatsByProfile = new Map<
    string,
    { average: number | null; count: number }
  >(),
): FeedPost {
  const stats = reviewStatsByProfile.get(post.author_id);

  return {
    id: post.id,
    authorId: post.author_id,
    type: post.type,
    title: post.title,
    description: post.description,
    creditValue: post.credit_value ?? 1,
    imageUrl: post.image_url ?? null,
    category: post.category ?? "other",
    status: normalizePostStatus(post.status),
    createdAt: post.created_at,
    authorRatingAverage: stats?.average ?? null,
    authorReviewCount: stats?.count ?? 0,
  };
}

function normalizePostStatus(
  status: FeedPost["status"] | null,
): FeedPost["status"] {
  if (
    status === "open" ||
    status === "paused" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "canceled"
  ) {
    return status;
  }

  return "open";
}

function formatPostDate(value: string | null) {
  if (!value) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getFeedSignature(posts: FeedPost[]) {
  return posts
    .map((post) =>
      [
        post.id,
        post.authorId,
        post.type,
        post.title,
        post.description,
        post.creditValue,
        post.imageUrl ?? "",
        post.category ?? "other",
        post.status,
        post.createdAt,
        post.authorRatingAverage ?? "",
        post.authorReviewCount,
      ].join(":"),
    )
    .join("|");
}
