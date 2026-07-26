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
    title: "One-Tap SOS",
    description:
      "Trigger an immediate distress signal with a single tap, instantly alerting local responders to your situation.",
  },
  {
    icon: <FiMessageCircle className="w-6 h-6" />,
    title: "Live Video Assistance",
    description:
      "Connect instantly with first responders via high-quality video or voice call so they can see exactly what's happening.",
  },
  {
    icon: <FiMapPin className="w-6 h-6" />,
    title: "Precise Location Sharing",
    description:
      "Share your exact location on the map with a single tap, eliminating the need to explain where you are during a crisis.",
  },
  {
    icon: <FiUsers className="w-6 h-6" />,
    title: "Direct to Authorities",
    description:
      "Your emergency is immediately routed to the appropriate local responders and coordinators for quick action.",
  },
  {
    icon: <FiShield className="w-6 h-6" />,
    title: "Secure & Reliable",
    description:
      "Advanced location verification ensures the emergency network stays free of prank calls, keeping lines open for real needs.",
  },
  {
    icon: <FiBell className="w-6 h-6" />,
    title: "Fastest Response Times",
    description:
      "Our smart coordination system organizes dispatchers and responders to ensure you get the help you need without delay.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-16 md:py-18 lg:py-24 bg-white relative overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-danger/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mx-auto mb-8 md:mb-16">
          <h2 className="title-large text-primary mb-3">Key Capabilities</h2>
          <h3 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-6 tracking-tight">
            Built for Critical Moments
          </h3>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Rescue Link provides the tools and infrastructure necessary for
            rapid, organized, and effective emergency response.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 xl:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 md:p-10 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-900/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
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
