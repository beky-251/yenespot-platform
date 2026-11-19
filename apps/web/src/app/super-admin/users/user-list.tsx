"use client";

import { useMemo, useState } from "react";

type UserAccount = {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: string;
  created_at: string;
  role: string;
};

type Props = {
  users: UserAccount[];
};

const filters = ["all", "customer", "business_owner"] as const;

export default function UserList({ users }: Props) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = filter === "all" || user.role === filter;
      const matchesSearch =
        !term ||
        (user.full_name ?? "").toLowerCase().includes(term) ||
        (user.phone ?? "").toLowerCase().includes(term);

      return matchesRole && matchesSearch;
    });
  }, [users, filter, search]);

  function roleLabel(role: string) {
    return role === "business_owner" ? "Business owner" : "Customer";
  }

  function roleStyle(role: string) {
    return role === "business_owner"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-700";
  }

  return (
    <div className="mt-8">
      <label
        htmlFor="user-search"
        className="mb-2 block text-sm font-semibold text-navy"
      >
        Search by name or phone number
      </label>

      <input
        id="user-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Enter a name or phone number..."
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-navy outline-none focus:border-green focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 sm:max-w-xl"
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item === "all"
              ? users.length
              : users.filter((user) => user.role === item).length;

          const label =
            item === "all"
              ? "All users"
              : item === "business_owner"
                ? "Business owners"
                : "Customers";

          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                filter === item
                  ? "bg-green text-white"
                  : "border border-border bg-white text-navy"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {filteredUsers.length} {filteredUsers.length === 1 ? "user found" : "users found"}
      </p>

      {filteredUsers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-white p-10 text-center">
          <h2 className="text-xl font-bold text-navy">No users found</h2>
          <p className="mt-2 text-sm text-muted">
            Try another name, phone number, or role filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredUsers.map((user) => (
            <article
              key={user.id}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${roleStyle(user.role)}`}
                  >
                    {roleLabel(user.role)}
                  </span>

                  <h2 className="mt-4 text-xl font-bold text-navy">
                    {user.full_name || "Name not provided"}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    {user.phone || "Phone number not provided"}
                  </p>
                </div>

                <p className="text-xs text-muted">
                  Registered{" "}
                  {new Date(user.created_at).toLocaleDateString("en-ET")}
                </p>
              </div>

              <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-muted">
                    PREFERRED LANGUAGE
                  </p>
                  <p className="mt-1 text-sm text-navy">
                    {user.preferred_language === "am" ? "Amharic" : "English"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted">ACCOUNT ROLE</p>
                  <p className="mt-1 text-sm text-navy">
                    {roleLabel(user.role)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}