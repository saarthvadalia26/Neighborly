"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

export type ChatMessage = {
  id: string;
  postId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string | null;
  senderUsername: string;
};

type PostChatProps = {
  postId: string;
  authorId: string;
  authorUsername: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  canSendMessage: boolean;
};

type MessageInsertPayload = {
  id: string;
  post_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string | null;
};

export function PostChat({
  postId,
  authorId,
  authorUsername,
  currentUserId,
  initialMessages,
  canSendMessage,
}: PostChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const inserted = payload.new as MessageInsertPayload;

          setMessages((currentMessages) => {
            if (currentMessages.some((message) => message.id === inserted.id)) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              normalizeInsertedMessage(inserted, {
                authorId,
                authorUsername,
                currentUserId,
              }),
            ];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authorId, authorUsername, currentUserId, postId, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        post_id: postId,
        sender_id: currentUserId,
        receiver_id: authorId,
        content: trimmedContent,
      })
      .select("id, post_id, sender_id, receiver_id, content, created_at")
      .single();

    setIsSending(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === data.id)) {
          return currentMessages;
        }

        return [
          ...currentMessages,
          normalizeInsertedMessage(data, {
            authorId,
            authorUsername,
            currentUserId,
          }),
        ];
      });
    }

    setContent("");
  }

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">
          Chat with the post author about details before swapping.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Message not sent</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid max-h-96 gap-3 overflow-y-auto rounded-xl border bg-muted/20 p-3">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isMine = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={isMine ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    isMine
                      ? "max-w-[80%] rounded-xl bg-primary px-3 py-2 text-primary-foreground"
                      : "max-w-[80%] rounded-xl bg-background px-3 py-2 ring-1 ring-border"
                  }
                >
                  <div className="mb-1 text-xs font-medium opacity-80">
                    {isMine ? "You" : message.senderUsername}
                  </div>
                  <p className="text-sm leading-6">{message.content}</p>
                  <div className="mt-1 text-xs opacity-70">
                    {formatMessageDate(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex min-h-32 items-center justify-center text-center text-sm text-muted-foreground">
            No messages yet.
          </div>
        )}
      </div>

      {canSendMessage ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`Message ${authorUsername}`}
            maxLength={1000}
          />
          <Button type="submit" disabled={isSending || !content.trim()} className="gap-2">
            <Send className="size-4" />
            Send
          </Button>
        </form>
      ) : (
        <Alert>
          <AlertTitle>Author view</AlertTitle>
          <AlertDescription>
            Messages from interested neighbors will appear here.
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}

function normalizeInsertedMessage(
  message: MessageInsertPayload,
  context: {
    authorId: string;
    authorUsername: string;
    currentUserId: string;
  },
): ChatMessage {
  return {
    id: message.id,
    postId: message.post_id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    content: message.content,
    createdAt: message.created_at,
    senderUsername:
      message.sender_id === context.currentUserId
        ? "You"
        : message.sender_id === context.authorId
          ? context.authorUsername
          : "Neighbor",
  };
}

function formatMessageDate(value: string | null) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
