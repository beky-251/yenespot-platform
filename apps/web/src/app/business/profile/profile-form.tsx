"use client";

import { useState, useTransition } from "react";
import { updateBusinessProfile } from "./actions";
import type { Database } from "@yenespot/supabase";

type Business = Database["public"]["Tables"]["businesses"]["Row"];

export default function ProfileForm({
  business,
}: {
  business: Business;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setMessage("");

    startTransition(async () => {
      const result = await updateBusinessProfile(formData);
      setMessage(result.message);
      setSuccess(result.success);
    });
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-navy outline-none focus:border-green focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2";

  return (
    <form action={handleSubmit} className="mt-8 space-y-6">
      <input type="hidden" name="businessId" value={business.id} />

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="text-sm font-semibold text-navy">
          Business name *
          <input
            name="name"
            required
            minLength={2}
            maxLength={150}
            defaultValue={business.name}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-navy">
          Phone number *
          <input
            name="phone"
            type="tel"
            required
            minLength={7}
            maxLength={30}
            defaultValue={business.phone ?? ""}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-navy">
          Email address
          <input
            name="email"
            type="email"
            defaultValue={business.email ?? ""}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-navy">
          Website
          <input
            name="website"
            type="url"
            placeholder="https://example.com"
            defaultValue={business.website ?? ""}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-navy">
          City *
          <input
            name="city"
            required
            maxLength={100}
            defaultValue={business.city}
            className={inputClass}
          />
        </label>

        <label className="text-sm font-semibold text-navy">
          Neighborhood
          <input
            name="neighborhood"
            maxLength={150}
            defaultValue={business.neighborhood ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-navy">
        Street address
        <input
          name="address"
          maxLength={300}
          defaultValue={business.address ?? ""}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-semibold text-navy">
        Business description
        <textarea
          name="description"
          rows={5}
          maxLength={3000}
          defaultValue={business.description ?? ""}
          placeholder="Tell customers about your business..."
          className={inputClass}
        />
      </label>

      {message && (
        <div
          role="status"
          className={`rounded-xl p-4 text-sm ${
            success
              ? "bg-green/10 text-green"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-green px-7 py-3 font-semibold text-white transition hover:bg-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving changes..." : "Save profile"}
      </button>
    </form>
  );
}