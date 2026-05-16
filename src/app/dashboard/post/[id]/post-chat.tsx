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

export type ChatParticipant = {
  id: string;
  username: string;
};

type PostChatProps = {
  postId: string;
  authorId: string;
  authorUsername: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  isAuthor: boolean;
  participants: ChatParticipant[];
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
  isAuthor,
  participants,
}: PostChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [chatParticipants, setChatParticipants] = useState(participants);
  const [selectedParticipantId, setSelectedParticipantId] = useState(
    isAuthor ? participants[0]?.id ?? "" : authorId,
  );
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeReceiverId = isAuthor ? selectedParticipantId : authorId;
  const activeReceiverUsername =
    chatParticipants.find((participant) => participant.id === activeReceiverId)
      ?.username ?? authorUsername;
  const visibleMessages = messages.filter((message) => {
    if (isAuthor) {
      return (
        message.senderId === selectedParticipantId ||
        message.receiverId === selectedParticipantId
      );
    }

    return message.senderId === authorId || message.receiverId === authorId;
  });
  const canSendMessage = Boolean(activeReceiverId);

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
                participants: chatParticipants,
              }),
            ];
          });

          if (isAuthor) {
            const participantId =
              inserted.sender_id === currentUserId
                ? inserted.receiver_id
                : inserted.sender_id;

            if (participantId !== currentUserId) {
              setChatParticipants((currentParticipants) => {
                if (
                  currentParticipants.some(
                    (participant) => participant.id === participantId,
                  )
                ) {
                  return currentParticipants;
                }

                return [
                  ...currentParticipants,
                  { id: participantId, username: "Neighbor" },
                ];
              });
              setSelectedParticipantId((currentParticipantId) =>
                currentParticipantId || participantId,
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    authorId,
    authorUsername,
    chatParticipants,
    currentUserId,
    isAuthor,
    postId,
    supabase,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || isSending || !activeReceiverId) {
      return;
    }

    setIsSending(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        post_id: postId,
        sender_id: currentUserId,
        receiver_id: activeReceiverId,
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
            participants: chatParticipants,
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
          {isAuthor
            ? "Reply to neighbors who have messaged about this post."
            : "Chat with the post author about details before swapping."}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Message not sent</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isAuthor && chatParticipants.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chatParticipants.map((participant) => (
            <Button
              key={participant.id}
              type="button"
              variant={
                selectedParticipantId === participant.id ? "default" : "outline"
              }
              onClick={() => setSelectedParticipantId(participant.id)}
            >
              {participant.username}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid max-h-96 gap-3 overflow-y-auto rounded-xl border bg-muted/20 p-3">
        {visibleMessages.length > 0 ? (
          visibleMessages.map((message) => {
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
            placeholder={`Message ${activeReceiverUsername}`}
            maxLength={1000}
          />
          <Button type="submit" disabled={isSending || !content.trim()} className="gap-2">
            <Send className="size-4" />
            Send
          </Button>
        </form>
      ) : (
        <Alert>
          <AlertTitle>No conversations yet</AlertTitle>
          <AlertDescription>
            When a neighbor messages you about this post, you can reply here.
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
    participants: ChatParticipant[];
  },
): ChatMessage {
  const participantUsername =
    context.participants.find(
      (participant) => participant.id === message.sender_id,
    )?.username ?? "Neighbor";

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
          : participantUsername,
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
