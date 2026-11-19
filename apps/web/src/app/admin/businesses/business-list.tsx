"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBusinessStatus,
  updateBusinessVerification,
} from "./actions";

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string;
  neighborhood: string | null;
  status: string;
  verified: boolean;
  average_rating: number;
  review_count: number;
  created_at: string;
  business_categories:
    | { name: string; name_am: string | null }
    | { name: string; name_am: string | null }[]
    | null;
};

type Props = {
  businesses: Business[];
};

const filters = [
  "all",
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;

export default function BusinessList({ businesses }: Props) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredBusinesses =
    filter === "all"
      ? businesses
      : businesses.filter((business) => business.status === filter);

  function changeStatus(business: Business, status: string) {
    const confirmed = window.confirm(
      `Are you sure you want to change "${business.name}" to ${status}?`,
    );

    if (!confirmed) return;

    setMessage("");

    startTransition(async () => {
      const result = await updateBusinessStatus(business.id, status);
      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function changeVerification(business: Business) {
    const nextValue = !business.verified;

    setMessage("");

    startTransition(async () => {
      const result = await updateBusinessVerification(
        business.id,
        nextValue,
      );
      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function statusStyle(status: string) {
    switch (status) {
      case "approved":
        return "bg-green/10 text-green";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "suspended":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gold/10 text-gold";
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item === "all"
              ? businesses.length
              : businesses.filter((business) => business.status === item)
                  .length;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 ${
                filter === item
                  ? "bg-green text-white"
                  : "border border-border bg-white text-navy"
              }`}
            >
              {item} ({count})
            </button>
          );
        })}
      </div>

      {message && (
        <div role="status" className="mt-5 rounded-xl border border-border bg-white p-4 text-sm text-navy">
          {message}
        </div>
      )}

      {filteredBusinesses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-white p-10 text-center">
          <h2 className="text-xl font-bold text-navy">
            No businesses found
          </h2>
          <p className="mt-2 text-sm text-muted">
            There are no businesses in this category yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {filteredBusinesses.map((business) => {
            const category = Array.isArray(business.business_categories)
              ? business.business_categories[0]
              : business.business_categories;

            return (
              <article
                key={business.id}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyle(
                        business.status,
                      )}`}
                    >
                      {business.status}
                    </span>

                    <h2 className="mt-4 text-xl font-bold text-navy">
                      {business.name}
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      {category?.name || "Uncategorized"}
                      {category?.name_am ? ` / ${category.name_am}` : ""}
                    </p>

                    <p className="mt-2 text-sm text-muted">
                      {business.city}
                      {business.neighborhood
                        ? ` · ${business.neighborhood}`
                        : ""}
                    </p>
                  </div>

                  <p className="text-xs text-muted">
                    Added{" "}
                    {new Date(business.created_at).toLocaleDateString("en-ET")}
                  </p>
                </div>

                {business.description && (
                  <p className="mt-5 text-sm leading-7 text-muted">
                    {business.description}
                  </p>
                )}

                <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-muted">PHONE</p>
                    <p className="mt-1 text-sm text-navy">
                      {business.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted">EMAIL</p>
                    <p className="mt-1 text-sm text-navy">
                      {business.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted">ADDRESS</p>
                    <p className="mt-1 text-sm text-navy">
                      {business.address || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted">RATING</p>
                    <p className="mt-1 text-sm text-navy">
                      {business.average_rating.toFixed(1)} / 5 (
                      {business.review_count} reviews)
                    </p>
                  </div>
                </div>

                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                  >
                    Visit website
                  </a>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  {business.status === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => changeStatus(business, "approved")}
                        className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => changeStatus(business, "rejected")}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {business.status === "approved" && (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => changeStatus(business, "suspended")}
                        className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      >
                        Suspend
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => changeVerification(business)}
                        className="rounded-xl bg-gold/10 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      >
                        {business.verified
                          ? "Remove verification"
                          : "Verify business"}
                      </button>

                      <a
                        href={`/business/${business.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      >
                        View public listing
                      </a>
                    </>
                  )}

                  {business.status === "suspended" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => changeStatus(business, "approved")}
                      className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                    >
                      Reactivate
                    </button>
                  )}

                  {business.status === "rejected" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => changeStatus(business, "pending")}
                      className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                    >
                      Return to pending
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

