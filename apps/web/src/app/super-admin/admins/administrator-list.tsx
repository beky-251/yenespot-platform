"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAdministratorRole } from "./actions";

type Account = {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: string;
  created_at: string;
  role: string;
};

type Props = {
  accounts: Account[];
};

const filters = ["all", "customer", "business_owner", "admin"] as const;

export default function AdministratorList({ accounts }: Props) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesRole = filter === "all" || account.role === filter;
      const matchesSearch =
        !term ||
        (account.full_name ?? "").toLowerCase().includes(term) ||
        (account.phone ?? "").toLowerCase().includes(term);

      return matchesRole && matchesSearch;
    });
  }, [accounts, filter, search]);

  function changeRole(account: Account, newRole: "customer" | "admin") {
    const action = newRole === "admin" ? "grant administrator access to" : "remove administrator access from";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${account.full_name || account.phone || "this account"}?`,
    );

    if (!confirmed) return;

    setMessage("");

    startTransition(async () => {
      const result = await updateAdministratorRole(account.id, newRole);
      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function roleLabel(role: string) {
    switch (role) {
      case "admin":
        return "Administrator";
      case "business_owner":
        return "Business owner";
      case "super_admin":
        return "Super administrator";
      case "customer":
        return "Customer";
      default:
        return "Unknown role";
    }
  }

  function roleStyle(role: string) {
    switch (role) {
      case "admin":
        return "bg-green/10 text-green";
      case "super_admin":
        return "bg-gold/15 text-navy";
      case "business_owner":
        return "bg-blue-100 text-blue-800";
      case "customer":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-red-100 text-red-700";
    }
  }

  return (
    <div className="mt-8">
      <label htmlFor="account-search" className="mb-2 block text-sm font-semibold text-navy">
        Search by name or phone number
      </label>

      <input
        id="account-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Enter a name or phone number..."
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-navy outline-none focus:border-green sm:max-w-xl"
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item === "all"
              ? accounts.length
              : accounts.filter((account) => account.role === item).length;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                filter === item
                  ? "bg-green text-white"
                  : "border border-border bg-white text-navy"
              }`}
            >
              {item === "all" ? "All accounts" : roleLabel(item)} ({count})
            </button>
          );
        })}
      </div>

      {message && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-border bg-white p-4 text-sm text-navy"
        >
          {message}
        </div>
      )}

      {filteredAccounts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-white p-10 text-center">
          <h2 className="text-xl font-bold text-navy">No accounts found</h2>
          <p className="mt-2 text-sm text-muted">
            Try another name, phone number, or role filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredAccounts.map((account) => (
            <article
              key={account.id}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${roleStyle(account.role)}`}
                  >
                    {roleLabel(account.role)}
                  </span>

                  <h2 className="mt-4 text-xl font-bold text-navy">
                    {account.full_name || "Name not provided"}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    {account.phone || "Phone number not provided"}
                  </p>
                </div>

                <p className="text-xs text-muted">
                  Registered{" "}
                  {new Date(account.created_at).toLocaleDateString("en-ET")}
                </p>
              </div>

              <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-muted">PREFERRED LANGUAGE</p>
                  <p className="mt-1 text-sm text-navy">
                    {account.preferred_language === "am" ? "Amharic" : "English"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted">ACCOUNT ROLE</p>
                  <p className="mt-1 text-sm text-navy">
                    {roleLabel(account.role)}
                  </p>
                </div>
              </div>

              {(account.role === "customer" || account.role === "admin") && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
                  {account.role === "customer" ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => changeRole(account, "admin")}
                      className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Promote to administrator
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => changeRole(account, "customer")}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Remove administrator access
                    </button>
                  )}
                </div>
              )}

              {(account.role === "business_owner" || account.role === "super_admin") && (
                <p className="mt-5 border-t border-border pt-5 text-xs text-muted">
                  Role changes are not available for this account.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}