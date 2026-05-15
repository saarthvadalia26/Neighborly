"use client";

import { useMemo, useState } from "react";
import { Coins } from "lucide-react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FeedPost = {
  id: string;
  type: "offer" | "need";
  title: string;
  description: string;
  karmaValue: number;
  createdAt: string | null;
};

type FeedFilter = "all" | "offer" | "need";

type PostsFeedProps = {
  posts: FeedPost[];
};

const filterLabels: Record<FeedFilter, string> = {
  all: "All",
  offer: "Offers",
  need: "Needs",
};

export function PostsFeed({ posts }: PostsFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const filteredPosts = useMemo(() => {
    if (filter === "all") {
      return posts;
    }

    return posts.filter((post) => post.type === filter);
  }, [filter, posts]);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Open swaps</h2>
          <p className="text-sm text-muted-foreground">
            {filteredPosts.length} {filterLabels[filter].toLowerCase()} available
          </p>
        </div>
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
                <span className="text-sm text-muted-foreground">Karma value</span>
                <Badge variant="secondary" className="gap-1">
                  <Coins className="size-3" />
                  {post.karmaValue}
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
          <div className="grid gap-2">
            <p className="font-medium">No open {filterLabels[filter].toLowerCase()} yet.</p>
            <p className="text-sm text-muted-foreground">
              New posts will appear here as neighbors add them.
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
