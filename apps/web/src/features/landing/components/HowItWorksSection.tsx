import React from "react";
import Image from "next/image";

const steps = [
  {
    num: "01",
    title: "Trigger Taguig SOS",
    desc: "Tap the SOS button. No account required. The system automatically acquires your coordinates."
  },
  {
    num: "02",
    title: "Location & IP Validation",
    desc: "Our system instantly verifies if your GPS and IP address are within Taguig City bounds to prevent spam."
  },
  {
    num: "03",
    title: "Real-time Connection",
    desc: "Establish a live video, voice, or chat connection directly with the Taguig Command Center."
  },
  {
    num: "04",
    title: "Immediate Dispatch",
    desc: "The Command Center accurately drops a pin on your location and deploys nearby resources immediately."
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
              <Image 
                src="/images/how-it-works.jpg" 
                alt="Emergency App Interface" 
                width={1000} 
                height={750} 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          
          <div className="order-1 lg:order-2 lg:pr-8">
            <h2 className="title-large text-primary mb-3">Simple Process</h2>
            <h3 className="font-outfit font-bold text-4xl md:text-5xl text-gray-900 mb-6 leading-tight">How Rescue Link Works</h3>
            <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed">
              In an emergency, complexity is the enemy. Our platform is designed to connect you with help in the fewest steps possible.
            </p>
            
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border-2 border-primary flex items-center justify-center font-bold text-primary shadow-sm text-lg">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h4>
                    <p className="text-gray-600 text-base md:text-lg leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
