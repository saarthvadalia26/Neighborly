export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          karma_balance: number | null;
          community_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          karma_balance?: number | null;
          community_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          karma_balance?: number | null;
          community_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          type: "offer" | "need";
          title: string;
          description: string;
          karma_value: number | null;
          status: "open" | "in_progress" | "completed" | "canceled" | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          type: "offer" | "need";
          title: string;
          description: string;
          karma_value?: number | null;
          status?: "open" | "in_progress" | "completed" | "canceled" | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          type?: "offer" | "need";
          title?: string;
          description?: string;
          karma_value?: number | null;
          status?: "open" | "in_progress" | "completed" | "canceled" | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          post_id: string;
          sender_id: string;
          receiver_id: string;
          amount: number;
          status: "pending" | "completed" | "disputed" | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          sender_id: string;
          receiver_id: string;
          amount: number;
          status?: "pending" | "completed" | "disputed" | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          sender_id?: string;
          receiver_id?: string;
          amount?: number;
          status?: "pending" | "completed" | "disputed" | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_receiver_id_fkey";
            columns: ["receiver_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          post_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_receiver_id_fkey";
            columns: ["receiver_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
