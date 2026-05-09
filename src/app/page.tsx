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

export default function Home() {
  return (
    <main>
      <Hero />
      <PainStack />
      <Services />
      <Process />
      <Story />
      <OfferStack />
      <Insurance />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
