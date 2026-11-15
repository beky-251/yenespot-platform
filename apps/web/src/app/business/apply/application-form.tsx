"use client";

import { useRef, useState, useTransition } from "react";
import type { Database } from "@yenespot/supabase";
import { submitBusinessApplication } from "./actions";

type Category = Pick<
  Database["public"]["Tables"]["business_categories"]["Row"],
  "id" | "name" | "name_am"
>;

type Props = {
  categories: Category[];
};

export default function ApplicationForm({ categories }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await submitBusinessApplication(formData);
      setResult(response);

      if (response.success) {
        formRef.current?.reset();
      }
    });
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-navy outline-none transition focus:border-green focus:ring-2 focus:ring-green/10";

  const labelClass = "text-sm font-semibold text-navy";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-7">
        <h2 className="text-xl font-bold text-navy">
          Business information
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tell us about your business so our team can review your application.
        </p>
      </div>

      {result && (
        <div
          role="status"
          className={`mb-6 rounded-xl p-4 text-sm ${
            result.success
              ? "border border-green/20 bg-green/5 text-green"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="businessName" className={labelClass}>
            Business name *
          </label>
          <input
            id="businessName"
            name="businessName"
            required
            minLength={2}
            maxLength={150}
            placeholder="e.g. Jimma Coffee House"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="categoryId" className={labelClass}>
            Business category *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.name_am ? ` / ${category.name_am}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Business description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={3000}
            placeholder="Describe your business, products, and services..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone number *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            minLength={7}
            maxLength={30}
            placeholder="+251 9..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Business email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={254}
            placeholder="business@example.com"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="website" className={labelClass}>
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            maxLength={500}
            placeholder="https://example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="city" className={labelClass}>
            City *
          </label>
          <input
            id="city"
            name="city"
            required
            minLength={2}
            maxLength={100}
            defaultValue="Jimma"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="neighborhood" className={labelClass}>
            Neighborhood
          </label>
          <input
            id="neighborhood"
            name="neighborhood"
            maxLength={150}
            placeholder="e.g. Ginjo Guduru"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className={labelClass}>
            Street address
          </label>
          <input
            id="address"
            name="address"
            maxLength={300}
            placeholder="Business location or nearby landmark"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-xs leading-5 text-muted">
          Your application will be reviewed by the YeneSpot administration
          team. Approval of your application creates a business listing,
          which must pass a separate listing review before becoming public.
        </p>

        <button
          type="submit"
          disabled={isPending || categories.length === 0}
          className="mt-6 w-full rounded-xl bg-green px-6 py-4 text-sm font-bold text-white transition hover:bg-green/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Submitting application..." : "Submit application"}
        </button>
      </div>
    </form>
  );
}