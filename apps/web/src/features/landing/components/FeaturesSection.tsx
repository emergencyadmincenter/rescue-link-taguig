import React from "react";
import {
  FiZap,
  FiMessageCircle,
  FiMapPin,
  FiUsers,
  FiShield,
  FiBell,
} from "react-icons/fi";

const features = [
  {
    icon: <FiZap className="w-6 h-6" />,
    title: "Fast Emergency Reporting",
    description:
      "Submit emergency requests instantly with just a few clicks to alert authorities.",
  },
  {
    icon: <FiMessageCircle className="w-6 h-6" />,
    title: "Real-time Communication",
    description:
      "Chat or speak directly with trained emergency coordinators while help is on the way.",
  },
  {
    icon: <FiMapPin className="w-6 h-6" />,
    title: "Location Sharing",
    description:
      "Automatically share your precise location to help responders find you faster.",
  },
  {
    icon: <FiUsers className="w-6 h-6" />,
    title: "Multi-agency Response",
    description:
      "Seamless coordination between police, fire, and medical departments.",
  },
  {
    icon: <FiShield className="w-6 h-6" />,
    title: "Secure & Confidential",
    description:
      "Your data and communications are encrypted and kept strictly confidential.",
  },
  {
    icon: <FiBell className="w-6 h-6" />,
    title: "Reliable Notifications",
    description:
      "Get updates on responder ETA and critical safety instructions.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-danger/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mx-auto mb-16">
          <h2 className="title-large text-primary mb-3">Key Capabilities</h2>
          <h3 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-6 tracking-tight">
            Built for Critical Moments
          </h3>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Rescue Link provides the tools and infrastructure necessary for
            rapid, organized, and effective emergency response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 md:p-10 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-primary mb-6">
                {feature.icon}
              </div>
              <h4 className="title-medium text-gray-900 mb-3">
                {feature.title}
              </h4>
              <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
