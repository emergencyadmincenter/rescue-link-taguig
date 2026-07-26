"use client";

import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
  {
    q: "Do I need to download an app or create an account?",
    a: "No. Rescue Link Taguig is a progressive web app. You can access it directly through your browser and trigger an SOS without needing an account.",
  },
  {
    q: "What happens if I am outside Taguig City?",
    a: "The system is strictly geo-fenced to Taguig City. If you trigger an SOS from outside the boundary, the system will alert you and block the request to prevent resource misallocation.",
  },
  {
    q: "Can I text instead of calling?",
    a: "Yes! While we offer high-fidelity WebRTC voice and video calls, there is a real-time chat fallback where you can type and send images if it's unsafe to speak.",
  },
  {
    q: "How does the system prevent fake emergency calls?",
    a: "Our advanced fraud detection compares your network IP address footprint against your device's GPS coordinates. Mismatches (like using VPNs to spoof locations) are flagged and blocked.",
  },
  {
    q: "Will responders know my exact location?",
    a: "Yes. With your browser permission, we instantly transmit your precise GPS coordinates. The Command Center drops a pin on our interactive Taguig map and dispatches resources directly to you.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-18 lg:py-24 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        <div className="text-center mb-16 mx-auto">
          <h2 className="title-large text-primary mb-3">Questions & Answers</h2>
          <h3 className="font-outfit font-bold text-4xl md:text-5xl text-gray-900 mb-6">
            Frequently Asked Questions
          </h3>
          <p className="text-lg md:text-xl text-gray-600">
            Find answers to common questions about using the Rescue Link
            platform.
          </p>
        </div>

        <div className="space-y-5 max-w-6xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "border-primary shadow-md" : "border-gray-200 hover:border-gray-300"}`}
              >
                <button
                  className="w-full px-6 py-6 md:px-8 md:py-6 text-left flex items-center justify-between focus:outline-none"
                  onClick={() => toggleOpen(index)}
                  aria-expanded={isOpen}
                >
                  <span className="text-lg md:text-xl font-semibold text-gray-900 pr-8">
                    {faq.q}
                  </span>
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? "bg-primary/10 text-primary rotate-180" : "bg-gray-50 text-gray-400"}`}
                  >
                    <FiChevronDown className="w-6 h-6" />
                  </div>
                </button>
                <div
                  className={`px-6 md:px-8 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-60 pb-8 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="text-gray-600 text-base md:text-lg border-t border-gray-100 pt-6 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
