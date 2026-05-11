import Nav from "./components/Nav";
import Hero from "./components/Hero";
import SocialProof from "./components/SocialProof";
import Pain from "./components/Pain";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import Membership from "./components/Membership";
import ValueStack from "./components/ValueStack";
import Compare from "./components/Compare";
import Doctors from "./components/Doctors";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Book from "./components/Book";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import StickyMobileCTA from "./components/StickyMobileCTA";
import JsonLd from "./components/JsonLd";

export default function Home() {
  return (
    <>
      <JsonLd />
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <Pain />
        <Services />
        <HowItWorks />
        <Membership />
        <ValueStack />
        <Compare />
        <Doctors />
        <Testimonials />
        <FAQ />
        <Book />
        <FinalCTA />
      </main>
      <Footer />
      <StickyMobileCTA />
    </>
  );
}
