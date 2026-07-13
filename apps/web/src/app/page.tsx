"use client";

import React, { useState } from "react";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { WhyChooseUsSection } from "@/features/landing/components/WhyChooseUsSection";
import { EmergencyTipsSection } from "@/features/landing/components/EmergencyTipsSection";
import { FAQSection } from "@/features/landing/components/FAQSection";
import { CTASection } from "@/features/landing/components/CTASection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { EmergencyDialog } from "@/features/landing/components/EmergencyDialog";
import { EmergencyHotlinesSection } from "@/features/landing/components/EmergencyHotlinesSection";

export default function LandingPage() {
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);

  const openEmergencyDialog = () => setIsEmergencyDialogOpen(true);
  const closeEmergencyDialog = () => setIsEmergencyDialogOpen(false);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
      <LandingHeader />

      <main>
        <HeroSection onRequestAssistance={openEmergencyDialog} />
        <EmergencyHotlinesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhyChooseUsSection />
        <EmergencyTipsSection />
        <FAQSection />
        <CTASection onRequestAssistance={openEmergencyDialog} />
      </main>

      <LandingFooter />

      <EmergencyDialog
        isOpen={isEmergencyDialogOpen}
        onClose={closeEmergencyDialog}
      />
    </div>
  );
}
