"use client";

import { useParams } from "next/navigation";
import { TitleDetail } from "../../../../components/title/title-detail";

export default function TitlePage() {
  const params = useParams<{ type: string; id: string }>();
  const type = params.type === "show" ? "show" : "movie";
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return <main className="grid min-h-dvh place-items-center bg-canvas text-text-muted">Invalid title.</main>;
  }
  return <TitleDetail type={type} id={id} />;
}
