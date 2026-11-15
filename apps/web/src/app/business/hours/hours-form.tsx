"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBusinessHours } from "./actions";

type DaySchedule = {
  dayOfWeek: number;
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
};

type InitialHour = {
  day_of_week: number;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

const DAYS = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

function createSchedule(initialHours: InitialHour[]): DaySchedule[] {
  return DAYS.map((day) => {
    const saved = initialHours.find(
      (hour) => hour.day_of_week === day.value,
    );

    return {
      dayOfWeek: day.value,
      isClosed: saved ? saved.is_closed : true,
      opensAt: saved?.opens_at?.slice(0, 5) ?? "09:00",
      closesAt: saved?.closes_at?.slice(0, 5) ?? "17:00",
    };
  });
}

export function HoursForm({
  businessId,
  initialHours,
}: {
  businessId: string;
  initialHours: InitialHour[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hours, setHours] = useState(() => createSchedule(initialHours));
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function updateDay(
    dayOfWeek: number,
    changes: Partial<DaySchedule>,
  ) {
    setHours((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, ...changes }
          : day,
      ),
    );
  }

  function handleSave() {
    setMessage("");
    setIsSuccess(false);

    startTransition(async () => {
      const result = await saveBusinessHours(businessId, hours);

      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E8E6DF] bg-white p-5">
        <p className="mb-5 text-sm leading-6 text-[#747C80]">
          Set the opening and closing times for each day.
          Select Closed when your business does not operate
          on a particular day.
        </p>

        <div className="space-y-4">
          {DAYS.map((day) => {
            const schedule = hours.find(
              (item) => item.dayOfWeek === day.value,
            )!;

            return (
              <div
                key={day.value}
                className="grid gap-4 border-b border-[#E8E6DF] pb-4 last:border-0 last:pb-0 sm:grid-cols-[130px_1fr_1fr_100px] sm:items-center"
              >
                <span className="font-semibold text-[#172B3A]">
                  {day.label}
                </span>

                <label className="space-y-1">
                  <span className="text-xs text-[#747C80]">
                    Opens
                  </span>
                  <input
                    type="time"
                    value={schedule.opensAt}
                    disabled={schedule.isClosed}
                    onChange={(event) =>
                      updateDay(day.value, {
                        opensAt: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#E8E6DF] px-3 py-2 text-sm disabled:bg-[#F5F4F0] disabled:text-gray-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs text-[#747C80]">
                    Closes
                  </span>
                  <input
                    type="time"
                    value={schedule.closesAt}
                    disabled={schedule.isClosed}
                    onChange={(event) =>
                      updateDay(day.value, {
                        closesAt: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[#E8E6DF] px-3 py-2 text-sm disabled:bg-[#F5F4F0] disabled:text-gray-400"
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#292D32]">
                  <input
                    type="checkbox"
                    checked={schedule.isClosed}
                    onChange={(event) =>
                      updateDay(day.value, {
                        isClosed: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#173B35]"
                  />
                  Closed
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-lg p-3 text-sm ${
            isSuccess
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-[#173B35] px-6 py-3 font-semibold text-white transition hover:bg-[#24564D] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving schedule..." : "Save schedule"}
      </button>
    </div>
  );
}