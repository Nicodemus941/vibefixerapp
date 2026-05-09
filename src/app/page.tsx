import Hero from "./components/Hero";
import PainStack from "./components/PainStack";
import Services from "./components/Services";
import Process from "./components/Process";
import Story from "./components/Story";
import Testimonials from "./components/Testimonials";
import Insurance from "./components/Insurance";
import OfferStack from "./components/OfferStack";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";

export default function Home() {
  return (
    <main>
      <Hero />
      <Reveal><PainStack /></Reveal>
      <Reveal><Services /></Reveal>
      <Reveal><Process /></Reveal>
      <Reveal><Story /></Reveal>
      <Reveal><OfferStack /></Reveal>
      <Reveal><Insurance /></Reveal>
      <Reveal><Testimonials /></Reveal>
      <Reveal><FAQ /></Reveal>
      <Reveal><FinalCTA /></Reveal>
      <Footer />
    </main>
  );
}
