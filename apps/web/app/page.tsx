import { TopBar } from "../components/marketing/top-bar";
import { Hero } from "../components/marketing/hero";
import { Showcase } from "../components/marketing/showcase";
import { WhySection } from "../components/marketing/why-section";
import { Faq } from "../components/marketing/faq";
import { SiteFooter } from "../components/marketing/site-footer";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main>
        <Hero />
        <Showcase />
        <WhySection />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
