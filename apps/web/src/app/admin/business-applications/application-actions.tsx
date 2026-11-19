"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveBusinessApplication,
  rejectBusinessApplication,
} from "./actions";

type Props = {
  applicationId: string;
};

export default function ApplicationActions({ applicationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function handleApprove() {
    const confirmed = window.confirm(
      "Approve this application? The applicant will become a business owner and a pending business listing will be created.",
    );

    if (!confirmed) return;

    setResult(null);

    startTransition(async () => {
      const response = await approveBusinessApplication(applicationId);
      setResult(response);

      if (response.success) {
        router.refresh();
      }
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      setResult({
        success: false,
        message: "Please provide a rejection reason.",
      });
      return;
    }

    setResult(null);

    startTransition(async () => {
      const response = await rejectBusinessApplication(
        applicationId,
        reason,
      );

      setResult(response);

      if (response.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      {result && (
        <div
          role="status"
          className={`mb-5 rounded-xl p-4 text-sm ${
            result.success
              ? "border border-green/20 bg-green/5 text-green"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </div>
      )}

      {!showRejectForm ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-xl bg-green px-5 py-3 text-sm font-bold text-white transition hover:bg-green/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          >
            {isPending ? "Processing..." : "Approve Application"}
          </button>

          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={isPending}
            className="rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            Reject Application
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <label
            htmlFor={`rejection-${applicationId}`}
            className="text-sm font-bold text-navy"
          >
            Reason for rejection *
          </label>

          <textarea
            id={`rejection-${applicationId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            rows={3}
            required
            placeholder="Explain why this application cannot be approved..."
            className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-navy outline-none focus:border-green focus:ring-2 focus:ring-green/10 focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          />

          <p className="mt-1 text-right text-xs text-muted">
            {reason.length}/1000
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending || !reason.trim()}
              className="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              {isPending ? "Processing..." : "Confirm Rejection"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false);
                setReason("");
                setResult(null);
              }}
              disabled={isPending}
              className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}