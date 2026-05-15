"use client";

import { useMemo, useState } from "react";
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

export type FeedPost = {
  id: string;
  type: "offer" | "need";
  title: string;
  description: string;
  creditValue: number;
  createdAt: string | null;
};

type FeedFilter = "all" | "offer" | "need";

type PostsFeedProps = {
  posts: FeedPost[];
};

const feedNouns: Record<FeedFilter, string> = {
  all: "swaps",
  offer: "offers",
  need: "needs",
};

export function PostsFeed({ posts }: PostsFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [query, setQuery] = useState("");
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (filter === "all") {
      return posts.filter((post) =>
        post.title.toLowerCase().includes(normalizedQuery),
      );
    }

    return posts.filter(
      (post) =>
        post.type === filter &&
        post.title.toLowerCase().includes(normalizedQuery),
    );
  }, [filter, posts, query]);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Open swaps</h2>
          <p className="text-sm text-muted-foreground">
            {filteredPosts.length} {feedNouns[filter]} available
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,320px)_auto] sm:items-center">
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
            value={filter}
            onValueChange={(value) => setFilter(value as FeedFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="offer">Offers</TabsTrigger>
              <TabsTrigger value="need">Needs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="min-h-44">
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {post.description}
                </CardDescription>
                <CardAction>
                  <Badge variant={post.type === "offer" ? "default" : "outline"}>
                    {post.type === "offer" ? "Offer" : "Need"}
                  </Badge>
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
          ))}
        </div>
      ) : (
        <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
          <div className="grid gap-2">
            <p className="font-medium">
              No open {feedNouns[filter]} found.
            </p>
            <p className="text-sm text-muted-foreground">
              Try another search or check back as neighbors add posts.
            </p>
          </div>
        </div>
      )}
    </section>
  );
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
