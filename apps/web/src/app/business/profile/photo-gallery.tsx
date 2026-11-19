"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteBusinessPhoto,
  uploadBusinessPhoto,
  setBusinessCoverPhoto,
  updateBusinessPhotoCaption,
} from "./photo-actions";
import type { Database } from "@yenespot/supabase";

type BusinessPhoto = Database["public"]["Tables"]["business_photos"]["Row"];

type PhotoGalleryProps = {
  businessId: string;
  photos: BusinessPhoto[];
};

export default function PhotoGallery({
  businessId,
  photos,
}: PhotoGalleryProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      setMessage("");

      const result = await uploadBusinessPhoto(formData);

      setMessage(result.message);

      if (result.success) {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  function handleDelete(photoId: string) {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    startTransition(async () => {
      setMessage("");

      const result = await deleteBusinessPhoto(businessId, photoId);

      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      setMessage("");

      const result = await setBusinessCoverPhoto(businessId, photoId);

      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleUpdateCaption(photoId: string, formData: FormData) {
    const caption = formData.get("caption");

    if (typeof caption !== "string") return;

    startTransition(async () => {
      setMessage("");

      const result = await updateBusinessPhotoCaption(
        businessId,
        photoId,
        caption,
      );

      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
      <div className="border-b border-border pb-5">
        <h2 className="text-xl font-bold text-navy">Business Photos</h2>

        <p className="mt-2 text-sm text-muted">
          Upload photos to showcase your business to customers. JPEG, PNG and
          WebP are supported. Maximum size: 5 MB.
        </p>
      </div>

      <form
        ref={formRef}
        action={handleUpload}
        className="mt-6 space-y-4 rounded-xl bg-cream p-5"
      >
        <input type="hidden" name="businessId" value={businessId} />

        <div>
          <label
            htmlFor="business-photo"
            className="mb-2 block text-sm font-semibold text-navy"
          >
            Choose a photo
          </label>

          <input
            id="business-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-green file:px-4 file:py-2 file:font-semibold file:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          />
        </div>

        <div>
          <label
            htmlFor="photo-caption"
            className="mb-2 block text-sm font-semibold text-navy"
          >
            Photo caption (optional)
          </label>

          <input
            id="photo-caption"
            name="caption"
            type="text"
            maxLength={300}
            placeholder="Describe your photo"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-green focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Please wait..." : "Upload photo"}
        </button>
      </form>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-cream p-3 text-sm text-navy"
        >
          {message}
        </p>
      )}

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-bold text-navy">
          Uploaded photos ({photos.length})
        </h3>

        {photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted">
              You have not uploaded any photos yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <article
                key={photo.id}
                className="overflow-hidden rounded-xl border border-border"
              >
                <div className="relative aspect-[4/3] bg-cream">
                  <Image
                    src={photo.image_url}
                    alt={photo.caption || "Business photo"}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>

                <div className="p-4">
                  {photo.is_cover && (
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
                      Cover photo
                    </span>
                  )}

                  <form
                    action={(formData) =>
                      handleUpdateCaption(photo.id, formData)
                    }
                    className="mt-3 space-y-2"
                  >
                    <label
                      htmlFor={`caption-${photo.id}`}
                      className="block text-xs font-semibold text-navy"
                    >
                      Photo caption
                    </label>

                    <input
                      id={`caption-${photo.id}`}
                      name="caption"
                      type="text"
                      maxLength={300}
                      defaultValue={photo.caption || ""}
                      placeholder="Describe this photo"
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                    />

                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-lg bg-green px-4 py-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      Save caption
                    </button>
                  </form>

                  {!photo.is_cover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(photo.id)}
                      disabled={isPending}
                      className="mt-4 mr-2 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      Set as cover
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={isPending}
                    className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    Delete photo
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
