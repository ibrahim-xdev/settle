import "../components/Landing-animations.css";
import Header from "../components/Header";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#17140F] antialiased">
      <Header />
      <Hero />
      <HowItWorks />
      <Footer />
    </div>
  );
}
