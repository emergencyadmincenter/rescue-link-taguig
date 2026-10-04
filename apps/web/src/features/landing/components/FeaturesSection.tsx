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
    icon: <FiZap className="w-5 h-5" />,
    title: "Instant Web Access",
    description:
      "No app installation or account registration required. Simply open the website and request immediate assistance during critical moments.",
  },
  {
    icon: <FiMessageCircle className="w-5 h-5" />,
    title: "Direct Communication",
    description:
      "Establish a secure, real-time voice or chat connection directly with the Taguig Command Center.",
  },
  {
    icon: <FiMapPin className="w-5 h-5" />,
    title: "Automated Geolocation",
    description:
      "The system securely acquires your precise GPS coordinates to help responders find you instantly without needing complex explanations.",
  },
  {
    icon: <FiUsers className="w-5 h-5" />,
    title: "Unified Response",
    description:
      "Seamlessly connects multiple local agencies (Police, Fire, Medical, Disaster Risk) into a single, coordinated response channel.",
  },
  {
    icon: <FiShield className="w-5 h-5" />,
    title: "Anti-Spam Security",
    description:
      "Built-in geographic IP validation and shadow banning systems ensure emergency lines stay open and available for real victims.",
  },
  {
    icon: <FiBell className="w-5 h-5" />,
    title: "Real-time Updates",
    description:
      "Receive live status updates on your rescue request, so you know exactly when help is arriving.",
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
        <div className="text-center mx-auto mb-10 md:mb-16">
          <h2 className="title-large text-primary mb-3">Key Capabilities</h2>
          <h3 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-6 tracking-tight">
            Built for Critical Moments
          </h3>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mx-auto">
            RescueLink provides the tools and infrastructure necessary for
            rapid, organized, and effective emergency response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative p-8 md:p-10 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden flex flex-col"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <h4 className="title-medium text-gray-900 mb-3">
                {feature.title}
              </h4>
              <p className="text-gray-600 leading-relaxed text-base">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
