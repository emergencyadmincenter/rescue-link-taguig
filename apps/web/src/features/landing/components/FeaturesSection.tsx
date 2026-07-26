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
    title: "Weather Clustering Insights",
    description:
      "Advanced geographical clustering of weather incidents to predict flooding and storm risks within specific Barangays.",
  },
  {
    icon: <FiMessageCircle className="w-6 h-6" />,
    title: "Real-time WebRTC",
    description:
      "High-fidelity voice and video connections enabling direct visual assessment between you and the Command Center.",
  },
  {
    icon: <FiMapPin className="w-6 h-6" />,
    title: "Precise Interactive Maps",
    description:
      "Coordinators accurately drop pins on interactive Taguig maps rather than relying on vaguely typed addresses.",
  },
  {
    icon: <FiUsers className="w-6 h-6" />,
    title: "Strict RBAC Control",
    description:
      "Dynamic Role-Based Access Control ensures only authorized dispatchers and admins can access critical resources.",
  },
  {
    icon: <FiShield className="w-6 h-6" />,
    title: "IP vs GPS Geoenforcing",
    description:
      "Robust fraud detection actively compares your network IP against your device GPS to block spam and prank calls.",
  },
  {
    icon: <FiBell className="w-6 h-6" />,
    title: "Centralized Workload Tracking",
    description:
      "The system monitors dispatcher workloads, response times, and peak hours to optimize Taguig City's emergency response.",
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
