import { Suspense } from "react";
import Hero from "./components/Hero";
import PainStack from "./components/PainStack";
import Services from "./components/Services";
import PriceCalculator from "./components/PriceCalculator";
import Process from "./components/Process";
import Story from "./components/Story";
import TeamStrip from "./components/TeamStrip";
import Gallery from "./components/Gallery";
import Testimonials from "./components/Testimonials";
import Insurance from "./components/Insurance";
import InsuranceCheck from "./components/InsuranceCheck";
import OfferStack from "./components/OfferStack";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";
import ReferralBanner from "./components/ReferralBanner";
import ExitIntentModal from "./components/ExitIntentModal";

export default function Home() {
  return (
    <main>
      <Suspense fallback={null}>
        <ReferralBanner />
      </Suspense>
      <Hero />
      <Reveal><PainStack /></Reveal>
      <Reveal><Services /></Reveal>
      <Reveal><PriceCalculator /></Reveal>
      <Reveal><Process /></Reveal>
      <Reveal><Story /></Reveal>
      <Reveal><TeamStrip /></Reveal>
      <Reveal><Gallery /></Reveal>
      <Reveal><OfferStack /></Reveal>
      <Reveal><InsuranceCheck /></Reveal>
      <Reveal><Insurance /></Reveal>
      <Reveal><Testimonials /></Reveal>
      <Reveal><FAQ /></Reveal>
      <Reveal><FinalCTA /></Reveal>
      <Footer />
      <ExitIntentModal />
    </main>
  );
}
