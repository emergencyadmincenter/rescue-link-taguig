import React from "react";
import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingFooter } from "@/features/landing/components/LandingFooter";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30 flex flex-col">
      <LandingHeader />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-24">
        <h1 className="display-medium text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last Updated: October 2026</p>

        <div className="prose prose-lg text-gray-700 space-y-6">
          <section>
            <h2 className="title-medium text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Rescue Link (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. This Service is designed specifically for residents and individuals within the jurisdiction of Taguig City, Philippines.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              Rescue Link is a web-based emergency response platform that connects users directly to the Taguig Command Center. It facilitates real-time location sharing, communication, and dispatching of emergency response units.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">3. Proper Use and Misuse</h2>
            <p>
              The Service is strictly for reporting genuine, life-threatening, or critical emergencies.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Prohibited Conduct:</strong> You must not use the Service to make prank calls, submit false reports, or harass operators. </li>
              <li><strong>Penalties under Philippine Law:</strong> Submitting malicious or false reports is a serious offense punishable under Philippine laws, such as Presidential Decree No. 1727 (Prank Caller Law) and related local ordinances.</li>
              <li><strong>Enforcement:</strong> We employ fraud assessment protocols. Users found abusing the system will be shadow-banned, permanently restricted from using the Service, and reported to law enforcement agencies for appropriate legal action.</li>
            </ul>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">4. Location and Tracking</h2>
            <p>
              By initiating an emergency request, you explicitly consent to the Service obtaining your real-time GPS location. This is critical for responders to find you. Ensure your browser or device permissions allow location access when using the Service.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">5. Disclaimer of Warranties</h2>
            <p>
              While we strive for high availability and rapid response, Rescue Link is provided "as is" and "as available." We do not guarantee that the Service will be uninterrupted, error-free, or that emergency responders will arrive within a guaranteed timeframe, as responses are subject to physical constraints such as traffic and resource availability.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by Philippine law, Rescue Link, its developers, and the Taguig Local Government Unit shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use or inability to use the Service during an emergency.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">7. Modifications to the Service</h2>
            <p>
              We reserve the right to modify or discontinue the Service (or any part thereof) temporarily or permanently with or without prior notice, in order to perform critical system upgrades or maintenance.
            </p>
          </section>

          <section>
            <h2 className="title-medium text-gray-900 mb-3">8. Contact Information</h2>
            <p>
              For non-emergency inquiries regarding these Terms of Service, please contact the appropriate Taguig City administrative offices.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
