import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const tips = [
  {
    title: "Keep Calm",
    description:
      "Take a deep breath. Staying calm helps you provide clear information to coordinators.",
  },
  {
    title: "Share Accurate Information",
    description:
      "Be ready to describe the nature of the emergency and any involved parties.",
  },
  {
    title: "Enable Location Services",
    description:
      "Ensure your phone's GPS is enabled so responders can find you quickly.",
  },
  {
    title: "Follow Instructions",
    description:
      "Listen carefully to the emergency coordinator and follow their directions.",
  },
  {
    title: "Stay in a Safe Location",
    description:
      "If possible, move to a safe area away from immediate danger while waiting.",
  },
  {
    title: "Keep Your Phone Nearby",
    description: "Do not hang up or close the app until instructed to do so.",
  },
];

export function EmergencyTipsSection() {
  return (
    <section className="py-24 bg-gray-900 text-white border-y border-gray-800 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-danger/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          <div className="w-full lg:w-[40%] lg:sticky lg:top-32">
            <div className="w-16 h-16 bg-danger/20 text-danger rounded-2xl flex items-center justify-center mb-6">
              <FiAlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="title-large text-danger mb-2">Be Prepared</h2>
            <h3 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-6 tracking-tight">
              Emergency Tips
            </h3>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
              Knowing what to do before an emergency happens can save lives.
              Keep these vital tips in mind.
            </p>
          </div>

          <div className="w-full lg:w-[60%] grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                    {index + 1}
                  </span>
                  {tip.title}
                </h4>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
