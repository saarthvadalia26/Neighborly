export type ReviewStats = {
  average: number | null;
  count: number;
};

type ReviewRating = {
  rating: number | null;
};

type ProfileReviewRating = ReviewRating & {
  reviewee_id: string;
};

export function summarizeReviews(reviews: ReviewRating[]): ReviewStats {
  const ratings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => typeof rating === "number");

  if (ratings.length === 0) {
    return { average: null, count: 0 };
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);

  return {
    average: total / ratings.length,
    count: ratings.length,
  };
}

export function buildReviewStatsByProfile(reviews: ProfileReviewRating[]) {
  const ratingsByProfile = new Map<string, ReviewRating[]>();

  for (const review of reviews) {
    const existingRatings = ratingsByProfile.get(review.reviewee_id) ?? [];
    existingRatings.push({ rating: review.rating });
    ratingsByProfile.set(review.reviewee_id, existingRatings);
  }

  return new Map(
    Array.from(ratingsByProfile.entries()).map(([profileId, ratings]) => [
      profileId,
      summarizeReviews(ratings),
    ]),
  );
}

export function formatRating(value: number) {
  return value.toFixed(1);
}
