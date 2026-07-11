"use client";

import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
  {
    q: "When should I use Rescue Link?",
    a: "Use Rescue Link for any situation that requires immediate assistance from police, fire, or medical emergency services. Do not use it for non-emergencies.",
  },
  {
    q: "What information should I provide?",
    a: "Be prepared to provide your exact location (if not automatically shared), the nature of the emergency, and details about any individuals involved.",
  },
  {
    q: "Can I use Chat instead of Voice?",
    a: "Yes. If you are in a situation where it is unsafe to speak, you can select the Live Chat option to communicate silently with an emergency coordinator.",
  },
  {
    q: "Is my information secure?",
    a: "Absolutely. All communications and personal data are heavily encrypted and only shared with authorized emergency responders.",
  },
  {
    q: "Does it work without an internet connection?",
    a: "Rescue Link requires an active cellular data or Wi-Fi connection to transmit your location and communicate with coordinators.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-gray-50">
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
