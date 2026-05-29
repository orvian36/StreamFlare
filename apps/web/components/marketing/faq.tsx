"use client";

import { SectionHeader } from "@streamflare/ui/components/brand/section-header";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@streamflare/ui/components/ui/accordion";
import faqs from "../../fixtures/faqs.json";

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 px-6 py-20 md:px-12">
      <SectionHeader index="03" title="Frequently asked questions" />
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((item) => (
          <AccordionItem key={item.id} value={`item-${item.id}`}>
            <AccordionTrigger className="text-left font-display text-lg">{item.header}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-text-muted">{item.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
