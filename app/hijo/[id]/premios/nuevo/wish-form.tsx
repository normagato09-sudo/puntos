"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useSync } from "@/components/sync-provider";
import { hardNavigate } from "@/lib/offline/hooks";
import { CameraIcon, LinkIcon, SendIcon, XIcon } from "@/components/icons";

/** Reduce la foto en el navegador para guardarla pequeña (JPEG ~640 px). */
async function shrinkImage(file: File, max = 640): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.75);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function WishForm({ childId }: { childId: number }) {
  const router = useRouter();
  const { submit } = useSync();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const n = Math.round(Number(price.replace(",", ".")));
  const field = "flex h-13 items-center gap-2 rounded-[14px] border border-line-strong bg-white px-3.5 focus-within:border-brand focus-within:border-2";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") ?? "").trim();
        const link = String(fd.get("link") ?? "").trim();
        if (!name) return setError("Escribe qué regalo te gustaría.");
        if (photo && !navigator.onLine) {
          return setError(
            "Para enviar la foto hace falta conexión. Quita la foto para enviarlo ahora, o espera a tener internet.",
          );
        }
        setPending(true);
        const r = await submit({
          type: "kid.wish",
          childId,
          name: name.slice(0, 80),
          price: n > 0 ? n : null,
          link: link || null,
          photo: photo || null,
        });
        setPending(false);
        if (r.error) return setError(r.error);
        const dest = `/hijo/${childId}/premios`;
        if (navigator.onLine) router.push(dest);
        else hardNavigate(dest);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="deseo" className="text-sm font-extrabold">
          Mi regalo
        </label>
        <input
          id="deseo"
          name="name"
          required
          maxLength={80}
          placeholder="Por ejemplo, un cubo de Rubik"
          className="h-13 rounded-[14px] border-2 border-brand bg-white px-3.5 text-[17px] font-bold placeholder:font-semibold placeholder:text-muted/70"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="precio" className="text-sm font-extrabold">
          Precio aproximado
        </label>
        <div className={field}>
          <input
            id="precio"
            name="price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0"
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] font-bold focus:outline-none"
          />
          <span className="text-[17px] font-extrabold text-muted">€</span>
        </div>
        <span className="text-xs font-bold text-muted">
          {n > 0 ? `Serían unos ${n} ${n === 1 ? "punto" : "puntos"}` : "Serían unos 0 puntos"} (1 punto = 1 €)
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="link" className="text-sm font-extrabold">
          Enlace del regalo
        </label>
        <div className={field}>
          <LinkIcon size={18} className="text-muted" />
          <input
            id="link"
            name="link"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            placeholder="Pega aquí el enlace de la tienda"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold focus:outline-none"
          />
        </div>
        <span className="text-xs font-bold text-muted">Así tus padres pueden verlo antes de aprobarlo.</span>
      </div>

      <input type="hidden" name="photo" value={photo} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Foto del regalo"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setPhotoError("");
          try {
            setPhoto(await shrinkImage(f));
          } catch {
            setPhotoError("No se ha podido leer la foto.");
          }
        }}
      />
      {photo ? (
        <div className="relative self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Foto del regalo" className="h-32 w-32 rounded-[18px] object-cover" />
          <button
            type="button"
            aria-label="Quitar la foto"
            onClick={() => {
              setPhoto("");
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"
          >
            <XIcon size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-dashed border-dash bg-white text-sm font-extrabold text-muted"
        >
          <CameraIcon size={28} />
          Añadir una foto (opcional)
        </button>
      )}
      {photoError && <p className="text-sm font-bold text-no">{photoError}</p>}

      {error && <p className="text-sm font-bold text-no">{error}</p>}

      <button
        disabled={pending}
        className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand text-base font-extrabold text-white disabled:opacity-60"
      >
        <SendIcon size={20} />
        {pending ? "Enviando…" : "Enviar a mis padres"}
      </button>
    </form>
  );
}
