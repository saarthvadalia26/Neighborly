"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Search } from "lucide-react";

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
import { createClient } from "@/lib/supabase/browser";

export type FeedPost = {
  id: string;
  type: "offer" | "need";
  title: string;
  description: string;
  creditValue: number;
  status: "open" | "paused" | "in_progress" | "completed" | "canceled";
  createdAt: string | null;
};

type TypeFilter = "all" | "offer" | "need";
type StatusFilter = "all" | "open" | "paused" | "completed";

type PostsFeedProps = {
  posts: FeedPost[];
};

type FeedPostRow = {
  id: string;
  type: "offer" | "need";
  title: string;
  description: string;
  credit_value: number | null;
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
  const [livePosts, setLivePosts] = useState(posts);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const refreshPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, type, title, description, credit_value, status, created_at")
      .in("status", ["open", "paused", "completed"])
      .order("created_at", { ascending: false });

    if (error || !data) {
      return;
    }

    setLivePosts(data.map(mapFeedPost));
  }, [supabase]);
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return livePosts.filter(
      (post) =>
        (typeFilter === "all" || post.type === typeFilter) &&
        (statusFilter === "all" || post.status === statusFilter) &&
        post.title.toLowerCase().includes(normalizedQuery),
    );
  }, [livePosts, query, statusFilter, typeFilter]);

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
      void refreshPosts();
    }, POST_REFRESH_INTERVAL_MS);
    const refreshOnFocus = () => {
      void refreshPosts();
    };

    window.addEventListener("focus", refreshOnFocus);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [refreshPosts]);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Swaps</h2>
          <p className="text-sm text-muted-foreground">
            {filteredPosts.length} {feedNouns[typeFilter]} shown
          </p>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,320px)_auto_auto] xl:items-center">
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
              <TabsTrigger value="all">All statuses</TabsTrigger>
              <TabsTrigger value="open">Available</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">All types</TabsTrigger>
              <TabsTrigger value="offer">Offers</TabsTrigger>
              <TabsTrigger value="need">Needs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/post/${post.id}`}
              className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="min-h-44 transition-colors hover:bg-muted/30">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.description}
                  </CardDescription>
                  <CardAction>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Badge
                        variant={post.type === "offer" ? "default" : "outline"}
                      >
                        {post.type === "offer" ? "Offer" : "Need"}
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
                <CardContent className="text-sm text-muted-foreground">
                  Posted {formatPostDate(post.createdAt)}
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
          ))}
        </div>
      ) : (
        <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
          <div className="grid gap-2">
            <p className="font-medium">
              No {feedNouns[typeFilter]} found.
            </p>
            <p className="text-sm text-muted-foreground">
              Try another search or change the filters.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function mapFeedPost(post: FeedPostRow): FeedPost {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    description: post.description,
    creditValue: post.credit_value ?? 1,
    status: normalizePostStatus(post.status),
    createdAt: post.created_at,
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
