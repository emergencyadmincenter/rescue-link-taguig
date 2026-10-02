import React from "react";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { FiShield, FiLock, FiEye, FiServer } from "react-icons/fi";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information Collection",
      icon: <FiEye className="w-5 h-5" />,
      content:
        "The City Government of Taguig, through the Rescue Link platform, strictly collects only data deemed essential for the provision of immediate emergency assistance. This encompasses precise geolocational coordinates, requisite contact identifiers, and associated hardware telemetry to ensure accurate dispatching and verify caller authenticity.",
    },
    {
      title: "Data Utilization",
      icon: <FiServer className="w-5 h-5" />,
      content:
        "All acquired information is exclusively utilized for emergency response orchestration. Data serves to rapidly triangulate incident locations, facilitate continuous communication between the reporting citizen and the Command Center, and maintain official historical logs necessary for post-incident municipal audits.",
    },
    {
      title: "Security & Encryption",
      icon: <FiLock className="w-5 h-5" />,
      content:
        "Information transit between the citizen's device and the Command Center utilizes industry-standard cryptographic protocols (TLS/SSL). At rest, data is secured within government-sanctioned infrastructure protected by rigorous access control policies, ensuring confidentiality against unauthorized interception.",
    },
    {
      title: "Disclosure Limitations",
      icon: <FiShield className="w-5 h-5" />,
      content:
        "The platform explicitly prohibits the monetization or commercial sharing of user data. Information is disclosed solely to dispatched responding units (e.g., Medical, Fire, Police) and, when mandated, to authorized legal entities acting under the jurisdiction of Philippine law.",
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
              Data Privacy Policy
            </h1>
            <p className="text-gray-500 text-lg mx-auto">
              Effective Date: October 2026. This document governs the data
              collection and security practices of the Rescue Link Taguig
              emergency response infrastructure.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto px-6 py-16">
          <div className="mb-16">
            <h2 className="title-medium text-gray-900 mb-6">
              Statement of Policy
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              The City Government of Taguig recognizes the fundamental right to
              privacy and is steadfastly committed to safeguarding the personal
              information of its citizens. The operation of the Rescue Link
              emergency response system adheres strictly to the principles and
              provisions of the Data Privacy Act of 2012 (Republic Act No.
              10173).
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              Participation in the platform and the subsequent reporting of
              emergency incidents constitutes explicit consent for the
              collection and processing of relevant personal and geolocational
              data strictly for life-saving and emergency mitigation purposes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                  {section.icon}
                </div>
                <h3 className="title-small text-gray-900 mb-3">
                  {section.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-2xl bg-gray-50 border border-gray-200 text-center">
            <h3 className="title-small text-gray-900 mb-2">
              Inquiries and Clarifications
            </h3>
            <p className="text-gray-600 text-sm mx-auto">
              Citizens requiring further clarification regarding these data
              privacy practices are directed to contact the official Taguig City
              Command Center administration.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
