import React from "react";
import Image from "next/image";
import { 
  SirenIllustration, 
  PoliceIllustration, 
  FireIllustration, 
  AmbulanceIllustration, 
  DisasterIllustration, 
  CoastGuardIllustration,
  HotlinesHeroIllustration
} from "./HotlineIllustrations";

const hotlines = [
  {
    icon: <SirenIllustration />,
    name: "Taguig Command Center",
    description: "Taguig City centralized emergency response",
    number: "0919-079-9286 / (02) 8789-3200",
    is247: true,
    bgClass: "bg-danger/5",
    borderClass: "border-danger/10",
  },
  {
    icon: <PoliceIllustration />,
    name: "PNP Taguig",
    description: "Taguig Police Station assistance",
    number: "(02) 8642-3582 / 0998-598-7932",
    is247: true,
    bgClass: "bg-blue-600/5",
    borderClass: "border-blue-600/10",
  },
  {
    icon: <FireIllustration />,
    name: "BFP Taguig",
    description: "Taguig Fire Station",
    number: "(02) 8837-0740 / 0906-211-0919",
    is247: true,
    bgClass: "bg-orange-500/5",
    borderClass: "border-orange-500/10",
  },
  {
    icon: <AmbulanceIllustration />,
    name: "Taguig Rescue",
    description: "Medical emergencies and ambulance",
    number: "0919-070-3112 / 0919-079-9112",
    is247: true,
    bgClass: "bg-rose-500/5",
    borderClass: "border-rose-500/10",
  },
  {
    icon: <DisasterIllustration />,
    name: "Taguig CDRRMO",
    description: "Taguig Disaster Risk Reduction",
    number: "(02) 7795-9932 / 0919-070-3112",
    is247: true,
    bgClass: "bg-emerald-600/5",
    borderClass: "border-emerald-600/10",
  },
  {
    icon: <CoastGuardIllustration />,
    name: "R.E.A.C.T.",
    description: "Roadside Emergency Assistance",
    number: "(02) 8640-7006 / 0929-631-5924",
    is247: true,
    bgClass: "bg-cyan-600/5",
    borderClass: "border-cyan-600/10",
  }
];

export function EmergencyHotlinesSection() {
  return (
    <section id="hotlines" className="py-24 bg-white relative overflow-hidden border-b border-gray-100">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/3 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-danger/5 rounded-full blur-[80px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Header Side */}
          <div className="w-full lg:w-[35%] lg:sticky lg:top-32 h-fit">
            <h2 className="title-large text-primary mb-3">Emergency Directory</h2>
            <h3 className="font-outfit font-bold text-4xl md:text-5xl text-gray-900 mb-6 tracking-tight">Direct Access to Help</h3>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10">
              Quickly access important emergency contacts whenever immediate assistance is needed. Keep these numbers handy for critical situations.
            </p>
            <HotlinesHeroIllustration />
          </div>
          
          {/* List Side */}
          <div className="w-full lg:w-[65%] flex flex-col gap-4">
            {hotlines.map((hotline, index) => (
              <div 
                key={index} 
                className={`flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 rounded-2xl border ${hotline.bgClass} ${hotline.borderClass}`}
              >
                <div className="flex items-center gap-6 mb-4 md:mb-0">
                  <div className="flex-shrink-0 bg-white rounded-2xl shadow-sm border border-white/50 p-2">
                    {hotline.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="title-medium text-gray-900">{hotline.name}</h4>
                      {hotline.is247 && (
                        <span className="px-2.5 py-0.5 bg-white text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm border border-gray-100">
                          24/7
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 hidden md:block">{hotline.description}</p>
                    <p className="font-outfit font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight mt-1 md:hidden">
                      {hotline.number}
                    </p>
                  </div>
                </div>
                
                <div className="hidden md:block md:text-right">
                  <span className="font-outfit font-bold text-3xl text-gray-900 tracking-tight">
                    {hotline.number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
