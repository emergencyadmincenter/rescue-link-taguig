import React from "react";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { FiAlertTriangle, FiMapPin, FiCrosshair, FiCpu } from "react-icons/fi";

export default function TermsOfServicePage() {
  const provisions = [
    {
      title: "Jurisdiction & Eligibility",
      icon: <FiMapPin className="w-5 h-5" />,
      content:
        "The Rescue Link platform operates exclusively within the territorial jurisdiction of Taguig City, Philippines. The system is designed to service residents and individuals currently situated within city limits. Dispatch protocols are structurally bound to Taguig municipal response units.",
    },
    {
      title: "Zero-Tolerance for Misuse",
      icon: <FiAlertTriangle className="w-5 h-5" />,
      content:
        "The filing of fraudulent emergency requests or prank calls is explicitly prohibited and constitutes a criminal offense under Presidential Decree No. 1727. The Command Center retains the absolute right to actively trace, permanently blacklist (shadow ban), and initiate prosecution against malicious actors.",
    },
    {
      title: "Consent to Geolocation",
      icon: <FiCrosshair className="w-5 h-5" />,
      content:
        "Activation of the emergency dispatch protocol requires unconditional consent to real-time GPS telemetry transmission. Failure to grant appropriate browser or device location permissions restricts the platform's operational capacity and relieves the municipality of liability regarding delayed response times.",
    },
    {
      title: "System Availability Constraints",
      icon: <FiCpu className="w-5 h-5" />,
      content:
        "While engineered for maximum resilience, the platform is provided on an 'as is' and 'as available' basis. The City Government does not mathematically guarantee uninterrupted service or instantaneous physical arrival of responders, as these are inherently subject to exogenous factors such as severe weather, traffic conditions, and concurrent critical municipal demands.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30 flex flex-col">
      <LandingHeader />

      <main className="flex-1 w-full">
        {/* Hero Banner */}
        <div className="w-full bg-gray-50 border-b border-gray-100 pb-8 pt-16 md:pt-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          <div className="mx-auto px-6 relative z-10 text-center">
            <h1 className="display-medium text-gray-900 mt-12 mb-4 lg:my-4 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-gray-500 text-lg mx-auto">
              Effective Date: October 2026. These terms strictly govern the
              authorized usage of the Rescue Link emergency response framework.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto px-6 py-16">
          <div className="mb-16">
            <h2 className="title-medium text-gray-900 mb-6">
              Binding Agreement
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              By accessing, browsing, or initiating any emergency transmission
              through the Rescue Link platform, the user explicitly acknowledges
              and agrees to be bound by the operational terms outlined herein.
              This framework exists strictly to facilitate critical, life-saving
              communication between citizens and the Taguig Command Center.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg text-danger font-medium bg-danger/5 p-4 rounded-xl border border-danger/10">
              Warning: Unauthorized access, penetration testing, or the
              submission of falsified incident reports will trigger immediate
              systemic lockdown protocols and subsequent legal referral.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {provisions.map((provision, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                  {provision.icon}
                </div>
                <h3 className="title-small text-gray-900 mb-3">
                  {provision.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {provision.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-2xl bg-gray-50 border border-gray-200 text-center">
            <h3 className="title-small text-gray-900 mb-2">
              Limitation of Municipal Liability
            </h3>
            <p className="text-gray-600 text-sm mx-auto">
              To the absolute extent permitted by Philippine law, the City
              Government of Taguig, its administrators, and technology partners
              shall not be held liable for incidental, consequential, or
              indirect damages arising from systemic outages, telecommunication
              failures, or uncontrollable environmental delays during an
              emergency operation.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
