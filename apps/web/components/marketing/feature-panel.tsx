import { FadeIn } from "@streamflare/ui";
import { cn } from "@streamflare/ui/lib/utils";

export interface FeaturePanelProps {
  title: string;
  subTitle: string;
  image: string;
  alt: string;
  reverse?: boolean;
}

export function FeaturePanel({ title, subTitle, image, alt, reverse }: FeaturePanelProps) {
  return (
    <FadeIn
      className={cn(
        "grid items-center gap-8 md:grid-cols-2",
        reverse && "md:[&>*:first-child]:order-2",
      )}
    >
      <div className="space-y-4">
        <h3 className="font-display text-3xl font-bold tracking-tight text-text md:text-4xl">{title}</h3>
        <p className="text-lg text-text-muted">{subTitle}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} loading="lazy" className="aspect-video w-full object-cover" />
      </div>
    </FadeIn>
  );
}
