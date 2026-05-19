"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LoaderCircle, MessageCircle, Send, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastNotice } from "@/components/toast-notice";
import { createClient } from "@/lib/supabase/browser";

export type ChatMessage = {
  id: string;
  postId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string | null;
  senderName: string;
};

export type ChatParticipant = {
  id: string;
  name: string;
};

type PostChatProps = {
  postId: string;
  authorId: string;
  authorName: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  isAuthor: boolean;
  isThreadClosed: boolean;
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

type MessageNotification = Pick<
  ChatMessage,
  "id" | "senderId" | "senderName" | "content"
>;

const MESSAGE_REFRESH_INTERVAL_MS = 3000;
const MESSAGE_NOTIFICATION_VISIBLE_MS = 5500;

export function PostChat({
  postId,
  authorId,
  authorName,
  currentUserId,
  initialMessages,
  isAuthor,
  isThreadClosed,
  participants,
}: PostChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const knownMessageIdsRef = useRef(
    new Set(initialMessages.map((message) => message.id)),
  );
  const refreshInFlightRef = useRef(false);
  const messageSignatureRef = useRef(getMessageSignature(initialMessages));
  const participantSignatureRef = useRef(
    getParticipantSignature(participants),
  );
  const [messages, setMessages] = useState(initialMessages);
  const [chatParticipants, setChatParticipants] = useState(participants);
  const [selectedParticipantId, setSelectedParticipantId] = useState(
    isAuthor ? participants[0]?.id ?? "" : authorId,
  );
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageNotification, setMessageNotification] =
    useState<MessageNotification | null>(null);
  const activeReceiverId = isAuthor ? selectedParticipantId : authorId;
  const activeReceiverName =
    chatParticipants.find((participant) => participant.id === activeReceiverId)
      ?.name ?? authorName;
  const visibleMessages = messages.filter((message) => {
    if (isAuthor) {
      return (
        message.senderId === selectedParticipantId ||
        message.receiverId === selectedParticipantId
      );
    }

    return message.senderId === authorId || message.receiverId === authorId;
  });
  const canSendMessage = Boolean(activeReceiverId) && !isThreadClosed;

  const refreshMessages = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;

    try {
      const { data: refreshedMessages, error: refreshError } = await supabase
        .from("messages")
        .select("id, post_id, sender_id, receiver_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (refreshError || !refreshedMessages) {
        return;
      }

      const profileIds = Array.from(
        new Set(
          refreshedMessages
            .flatMap((message) => [message.sender_id, message.receiver_id])
            .concat([authorId, currentUserId]),
        ),
      );
      const nameById = new Map<string, string>([
        [authorId, authorName],
        [currentUserId, "You"],
      ]);

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", profileIds);

        for (const profile of profiles ?? []) {
          if (profile.name) {
            nameById.set(profile.id, profile.name);
          }
        }
      }

      const nextMessages = refreshedMessages.map((message) => ({
        id: message.id,
        postId: message.post_id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        content: message.content,
        createdAt: message.created_at,
        senderName:
          message.sender_id === currentUserId
            ? "You"
            : nameById.get(message.sender_id) ?? "Neighbor",
      }));
      const newIncomingMessages = nextMessages.filter(
        (message) =>
          message.senderId !== currentUserId &&
          !knownMessageIdsRef.current.has(message.id),
      );

      for (const message of nextMessages) {
        knownMessageIdsRef.current.add(message.id);
      }

      const nextMessageSignature = getMessageSignature(nextMessages);

      if (messageSignatureRef.current !== nextMessageSignature) {
        messageSignatureRef.current = nextMessageSignature;
        setMessages(nextMessages);
      }

      const latestIncomingMessage =
        newIncomingMessages[newIncomingMessages.length - 1];

      if (latestIncomingMessage) {
        setMessageNotification({
          id: latestIncomingMessage.id,
          senderId: latestIncomingMessage.senderId,
          senderName: latestIncomingMessage.senderName,
          content: latestIncomingMessage.content,
        });
      }

      if (isAuthor) {
        const nextParticipants = Array.from(
          new Set(
            refreshedMessages
              .flatMap((message) => [message.sender_id, message.receiver_id])
              .filter((profileId) => profileId !== authorId),
          ),
        ).map((profileId) => ({
          id: profileId,
          name: nameById.get(profileId) ?? "Neighbor",
        }));
        const nextParticipantSignature =
          getParticipantSignature(nextParticipants);

        if (participantSignatureRef.current !== nextParticipantSignature) {
          participantSignatureRef.current = nextParticipantSignature;
          setChatParticipants(nextParticipants);
        }

        setSelectedParticipantId(
          (currentParticipantId) =>
            currentParticipantId || nextParticipants[0]?.id || "",
        );
      }
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [
    authorId,
    authorName,
    currentUserId,
    isAuthor,
    postId,
    supabase,
  ]);

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
        () => {
          void refreshMessages();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [postId, refreshMessages, supabase]);

  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshMessages();
      }
    }, MESSAGE_REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshMessages();
      }
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshMessages]);

  useEffect(() => {
    if (!messageNotification) {
      return;
    }

    const dismissTimer = window.setTimeout(() => {
      setMessageNotification(null);
    }, MESSAGE_NOTIFICATION_VISIBLE_MS);

    return () => {
      window.clearTimeout(dismissTimer);
    };
  }, [messageNotification]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || isSending || !activeReceiverId || isThreadClosed) {
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
      knownMessageIdsRef.current.add(data.id);

      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === data.id)) {
          return currentMessages;
        }

        const nextMessages = [
          ...currentMessages,
          normalizeInsertedMessage(data, {
            authorId,
            authorName,
            currentUserId,
            participants: chatParticipants,
          }),
        ];

        messageSignatureRef.current = getMessageSignature(nextMessages);

        return nextMessages;
      });
    }

    setContent("");
  }

  return (
    <section className="grid gap-4">
      {messageNotification ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 w-[min(calc(100vw-2rem),22rem)] rounded-lg border bg-background p-3 shadow-lg ring-1 ring-border"
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="grid min-w-0 flex-1 gap-1 text-left"
              onClick={() => {
                if (isAuthor) {
                  setSelectedParticipantId(messageNotification.senderId);
                }

                setMessageNotification(null);
              }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="size-4" />
                New message
              </div>
              <div className="truncate text-sm font-medium">
                {messageNotification.senderName}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {messageNotification.content}
              </p>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Dismiss message notification"
              onClick={() => setMessageNotification(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">
          {isAuthor
            ? "Reply to neighbors who have messaged about this post."
            : "Chat with the post author about details before swapping."}
        </p>
      </div>

      {error ? (
        <ToastNotice
          variant="error"
          title="Message not sent"
          description={error}
        />
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
              {participant.name}
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
                    {isMine ? "You" : message.senderName}
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

      {isThreadClosed ? (
        <div className="grid gap-3">
          <Alert>
            <AlertTitle>Transaction Completed</AlertTitle>
            <AlertDescription>
              This swap is complete, so the message thread is closed.
            </AlertDescription>
          </Alert>
          <form className="flex gap-2">
            <Input
              disabled
              placeholder="Transaction completed - messages are closed"
            />
            <Button type="button" disabled className="gap-2">
              <Send className="size-4" />
              Send
            </Button>
          </form>
        </div>
      ) : canSendMessage ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`Message ${activeReceiverName}`}
            maxLength={1000}
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={isSending || !content.trim()}
            className="gap-2"
          >
            {isSending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {isSending ? "Sending" : "Send"}
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
    authorName: string;
    currentUserId: string;
    participants: ChatParticipant[];
  },
): ChatMessage {
  const participantName =
    context.participants.find(
      (participant) => participant.id === message.sender_id,
    )?.name ?? "Neighbor";

  return {
    id: message.id,
    postId: message.post_id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    content: message.content,
    createdAt: message.created_at,
    senderName:
      message.sender_id === context.currentUserId
        ? "You"
        : message.sender_id === context.authorId
          ? context.authorName
          : participantName,
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

function getMessageSignature(messages: ChatMessage[]) {
  return messages
    .map((message) =>
      [
        message.id,
        message.senderId,
        message.receiverId,
        message.content,
        message.createdAt,
        message.senderName,
      ].join(":"),
    )
    .join("|");
}

function getParticipantSignature(participants: ChatParticipant[]) {
  return participants
    .map((participant) => `${participant.id}:${participant.name}`)
    .join("|");
}
