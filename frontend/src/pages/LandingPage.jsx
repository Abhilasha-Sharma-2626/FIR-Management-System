import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import FIRJourneySection from '../components/landing/FIRJourneySection';
import ProcessSection from '../components/landing/ProcessSection';
import TransparencySection from '../components/landing/TransparencySection';
import ProductPreview from '../components/landing/ProductPreview';
import FAQSection from '../components/landing/FAQSection';
import FinalCTA from '../components/landing/FinalCTA';
import { useLenis } from '../hooks/useLenis';

export function LandingPage() {
  // Initialize smooth scroll loop
  useLenis();

  return (
    <div className="min-h-screen bg-ivory text-ink flex flex-col antialiased selection:bg-navy selection:text-ivory">
      {/* Refined Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* A. Hero Section */}
        <HeroSection />

        {/* B. Signature Scroll-Driven FIR Journey */}
        <FIRJourneySection />

        {/* C. Capabilities & Architecture Process Overview */}
        <ProcessSection />

        {/* D. Transparency & Public Accountability */}
        <TransparencySection />

        {/* E. Interactive Product Tracking Preview */}
        <ProductPreview />

        {/* F. Citizen FAQ */}
        <FAQSection />

        {/* G. Closing Call to Action */}
        <FinalCTA />
      </main>

      {/* Accessible Civic Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
