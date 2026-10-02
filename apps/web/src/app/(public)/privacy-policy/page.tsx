import React from "react";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingFooter } from "@/features/landing/components/LandingFooter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30 flex flex-col">
      <LandingHeader />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-24">
        <h1 className="display-medium text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last Updated: October 2026</p>

        <div className="prose prose-lg text-gray-700 space-y-6">
          <section>
            <h2 className="title-medium text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Rescue Link ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information when you use our web-based emergency response platform designed for the City of Taguig.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">2. Information We Collect</h2>
            <p>
              When you use our application to request emergency assistance, we collect information that is strictly necessary for providing rapid emergency response. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Location Data:</strong> We collect your precise GPS coordinates to help responders locate you instantly. This is vital for the core functionality of the service.</li>
              <li><strong>Contact Information:</strong> We may ask for your phone number or name so that the Command Center can coordinate with you effectively.</li>
              <li><strong>Device & Interaction Information:</strong> We collect non-personally identifiable metrics (such as IP address, browser type, and device UUID) for fraud prevention, shadow banning malicious users (e.g., prank callers), and maintaining system security.</li>
              <li><strong>Communications:</strong> Any chats, audio calls, and incident descriptions provided during an emergency session are logged for coordination and legal compliance purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>
              The information we collect is used primarily to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Dispatch emergency units (Medical, Fire, Police, etc.) to your precise location.</li>
              <li>Enable seamless real-time communication between you and the Taguig Command Center.</li>
              <li>Maintain an accurate log of emergencies for post-incident review and analytics by the local government.</li>
              <li>Prevent system abuse, prank calls, and fraudulent requests through automated assessments.</li>
            </ul>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">4. Information Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. Your data is shared strictly with authorized personnel, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>First Responders and Agencies:</strong> Taguig Command Center operators, PNP, BFP, and Medical Rescue units who need your information to assist you.</li>
              <li><strong>Legal Authorities:</strong> When required by Philippine law to comply with legal processes or protect public safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures, including encryption and secure real-time protocols (WebSockets), to protect your data. However, please be aware that no method of transmission over the internet is completely secure.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">6. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or how your data is handled, please contact the Taguig Command Center via their official communication channels.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
