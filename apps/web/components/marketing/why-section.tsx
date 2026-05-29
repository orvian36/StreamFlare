import { SectionHeader } from "@streamflare/ui";
import { FeaturePanel } from "./feature-panel";
import jumbo from "../../fixtures/jumbo.json";

export function WhySection() {
  return (
    <section className="mx-auto max-w-6xl space-y-12 px-6 py-20 md:px-12">
      <SectionHeader index="02" title="Why StreamFlare" />
      <div className="space-y-20">
        {jumbo.map((item) => (
          <FeaturePanel
            key={item.id}
            title={item.title}
            subTitle={item.subTitle}
            image={item.image}
            alt={item.alt}
            reverse={item.direction === "row-reverse"}
          />
        ))}
      </div>
    </section>
  );
}
