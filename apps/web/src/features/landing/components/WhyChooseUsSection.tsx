import React from "react";
import Image from "next/image";
import { FiCheckCircle } from "react-icons/fi";

const reasons = [
  "Fast, reliable response times",
  "Professional emergency coordination",
  "Secure and encrypted communication",
  "Built specifically for community safety",
  "Direct line to local first responders",
  "Accessible 24/7/365",
];

export function WhyChooseUsSection() {
  return (
    <section className="py-16 md:py-18 lg:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center">
          <div className="lg:pr-8">
            <h2 className="title-large text-primary mb-3">Community First</h2>
            <h3 className="font-outfit font-bold text-4xl md:text-5xl text-gray-900 mb-6 leading-tight">
              Why Choose Rescue Link
            </h3>
            <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
              We bridge the gap between residents and emergency services,
              providing a reliable technological foundation for public safety.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {reasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-4">
                  <FiCheckCircle className="w-7 h-7 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-base md:text-lg text-gray-700 font-medium leading-tight">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-green-500/10 rounded-full blur-3xl transform translate-x-10 translate-y-10"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white p-2">
              <div className="rounded-xl overflow-hidden">
                <Image
                  src="/images/community-safety.jpg"
                  alt="Safe Community"
                  width={1000}
                  height={750}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
