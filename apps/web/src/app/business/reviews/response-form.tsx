"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitBusinessResponse,
  updateBusinessResponse,
  deleteBusinessResponse,
} from "./actions";

type ResponseFormProps = {
  businessId: string;
  reviewId: string;
  existingResponse: {
    id: string;
    response: string;
  } | null;
};

export default function ResponseForm({
  businessId,
  reviewId,
  existingResponse,
}: ResponseFormProps) {
  const router = useRouter();

  const [response, setResponse] = useState(
    existingResponse?.response ?? "",
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("reviewId", reviewId);
    formData.set("response", response);

    startTransition(async () => {
      const result = existingResponse
        ? await updateBusinessResponse(formData)
        : await submitBusinessResponse(formData);

      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!existingResponse) return;

    if (!window.confirm("Are you sure you want to delete this response?")) {
      return;
    }

    setMessage("");

    startTransition(async () => {
      const result = await deleteBusinessResponse(
        existingResponse.id,
        businessId,
      );

      setMessage(result.message);

      if (result.success) {
        setResponse("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-[#D5A642]/30 bg-[#FAF9F6] p-4">
      <h4 className="mb-2 font-semibold text-[#173B35]">
        {existingResponse ? "Your response" : "Respond to this review"}
      </h4>

      <form onSubmit={handleSubmit}>
        <textarea
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          placeholder="Thank this customer or respond to their feedback..."
          maxLength={2000}
          required
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-[#292D32] outline-none focus:border-[#D5A642] focus:ring-2 focus:ring-[#D5A642]/20"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            {response.length}/2000 characters
          </span>

          <div className="flex gap-2">
            {existingResponse && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            )}

            <button
              type="submit"
              disabled={isPending || !response.trim()}
              className="rounded-lg bg-[#173B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#24564D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : existingResponse
                  ? "Update response"
                  : "Publish response"}
            </button>
          </div>
        </div>
      </form>

      {message && (
        <p
          role="status"
          className="mt-3 text-sm text-[#173B35]"
        >
          {message}
        </p>
      )}
    </div>
  );
}