import Nav from "@/app/components/nav";
import Hero from "@/app/components/hero";
import HowItWorks from "@/app/components/how-it-works";
import Features from "@/app/components/features";
import TerminalDemo from "@/app/components/terminal-demo";
import WaitlistCTA from "@/app/components/waitlist-cta";
import Footer from "@/app/components/footer";

export default function HomePage() {
  return (
    <main className="bg-black min-h-screen">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <TerminalDemo />
      <WaitlistCTA />
      <Footer />
    </main>
  );
}
