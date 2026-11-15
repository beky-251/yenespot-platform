"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addBusinessService,
  updateBusinessService,
  deleteBusinessService,
} from "./actions";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  is_available: boolean;
  sort_order: number;
};

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  price: "",
  isAvailable: true,
};

export function ServicesManager({
  businessId,
  initialServices,
}: {
  businessId: string;
  initialServices: Service[];
}) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setIsFormOpen(true);
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: service.price?.toString() ?? "",
      isAvailable: service.is_available,
    });
    setMessage("");
    setIsFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const input = {
      businessId,
      name: form.name,
      description: form.description,
      price: form.price.trim() === "" ? null : Number(form.price),
      isAvailable: form.isAvailable,
    };

    if (
      input.price !== null &&
      (!Number.isFinite(input.price) || input.price < 0)
    ) {
      setMessage("Please enter a valid non-negative price.");
      setIsSuccess(false);
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateBusinessService(editingId, input)
        : await addBusinessService(input);

      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success) {
        setForm(emptyForm);
        setEditingId(null);
        setIsFormOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(serviceId: string) {
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }

    setMessage("");

    startTransition(async () => {
      const result = await deleteBusinessService(businessId, serviceId);

      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success) {
        setServices((current) =>
          current.filter((service) => service.id !== serviceId),
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172B3A]">
            Your Services
          </h2>
          <p className="mt-1 text-sm text-[#747C80]">
            Add and manage the products or services you offer.
          </p>
        </div>

        <button
          type="button"
          onClick={startAdd}
          className="rounded-lg bg-[#173B35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#24564D]"
        >
          + Add service
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[#E8E6DF] bg-white p-6"
        >
          <h3 className="text-lg font-bold text-[#172B3A]">
            {editingId ? "Edit service" : "Add a new service"}
          </h3>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#292D32]">
              Service name *
            </span>
            <input
              required
              minLength={2}
              maxLength={150}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="e.g. Traditional Coffee Ceremony"
              className="w-full rounded-lg border border-[#E8E6DF] px-4 py-3 text-sm outline-none focus:border-[#173B35]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#292D32]">
              Description
            </span>
            <textarea
              maxLength={1000}
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Describe this service..."
              className="w-full rounded-lg border border-[#E8E6DF] px-4 py-3 text-sm outline-none focus:border-[#173B35]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#292D32]">
              Price (ETB)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: event.target.value })
              }
              placeholder="Leave blank if price varies"
              className="w-full rounded-lg border border-[#E8E6DF] px-4 py-3 text-sm outline-none focus:border-[#173B35]"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#292D32]">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(event) =>
                setForm({ ...form, isAvailable: event.target.checked })
              }
              className="h-4 w-4 accent-[#173B35]"
            />
            Service is currently available
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-[#173B35] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending
                ? "Saving..."
                : editingId
                  ? "Update service"
                  : "Add service"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
                setForm(emptyForm);
                setMessage("");
              }}
              className="rounded-lg border border-[#E8E6DF] px-5 py-3 text-sm font-semibold text-[#292D32]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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

      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D8D5CC] bg-white p-10 text-center">
          <h3 className="font-bold text-[#172B3A]">
            No services added yet
          </h3>
          <p className="mt-2 text-sm text-[#747C80]">
            Add your first service to help customers understand what you offer.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-xl border border-[#E8E6DF] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#172B3A]">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="mt-2 text-sm leading-6 text-[#747C80]">
                      {service.description}
                    </p>
                  )}

                  <p className="mt-3 font-semibold text-[#173B35]">
                    {service.price === null
                      ? "Price on request"
                      : `${service.price.toLocaleString("en-ET", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} ETB`}
                  </p>

                  <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      service.is_available
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {service.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(service)}
                    className="rounded-lg border border-[#E8E6DF] px-3 py-2 text-sm font-medium text-[#173B35] hover:bg-[#FAF9F6]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
                    disabled={isPending}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}