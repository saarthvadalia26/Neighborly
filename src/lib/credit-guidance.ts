export type PostType = "offer" | "need";

export type CreditPricingPost = {
  type: PostType | null;
  title: string | null;
  creditValue: number | null;
};

export type CreditSuggestion = {
  value: number;
  sampleSize: number;
};

export const CREDIT_VALUE_GUIDE = [
  { value: 1, label: "Quick", description: "Few minutes or simple lending" },
  { value: 2, label: "Small", description: "About 15-30 minutes" },
  { value: 3, label: "Medium", description: "About 30-60 minutes" },
  { value: 4, label: "Skilled", description: "Skilled or tool-heavy help" },
  { value: 5, label: "Big", description: "High effort, urgent, or long" },
] as const;

const STOP_WORDS = new Set([
  "and",
  "are",
  "can",
  "for",
  "from",
  "help",
  "need",
  "offer",
  "please",
  "the",
  "this",
  "with",
  "you",
]);

export function getCreditSuggestion(
  posts: CreditPricingPost[],
  type: PostType,
  title: string,
): CreditSuggestion | null {
  const titleTokens = tokenize(title);

  if (titleTokens.length === 0) {
    return null;
  }

  const matches = posts
    .map((post) => {
      if (post.type !== type || !post.title || post.creditValue === null) {
        return null;
      }

      const postTokens = tokenize(post.title);
      const overlap = titleTokens.filter((token) =>
        postTokens.includes(token),
      ).length;

      if (overlap === 0) {
        return null;
      }

      return {
        creditValue: clampCreditValue(post.creditValue),
        score: overlap / titleTokens.length,
      };
    })
    .filter((match): match is { creditValue: number; score: number } =>
      Boolean(match),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (matches.length === 0) {
    return null;
  }

  const average =
    matches.reduce((total, match) => total + match.creditValue, 0) /
    matches.length;

  return {
    value: clampCreditValue(Math.round(average)),
    sampleSize: matches.length,
  };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function clampCreditValue(value: number) {
  return Math.min(Math.max(value, 1), 5);
}
