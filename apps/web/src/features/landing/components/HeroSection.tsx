import React from "react";
import Image from "next/image";
import { FiArrowRight, FiInfo } from "react-icons/fi";

interface HeroSectionProps {
  onRequestAssistance: () => void;
}

const heroStyles = `
  @keyframes float-collage {
    0%, 100% { 
      transform: translate3d(3rem, -3rem, 0) rotate(12deg) scale(1.25); 
    }
    50% { 
      transform: translate3d(3rem, -5rem, 0) rotate(11deg) scale(1.25); 
    }
  }
  .animate-float-collage { 
    animation: float-collage 25s ease-in-out infinite; 
    will-change: transform; 
  }
`;

export function HeroSection({ onRequestAssistance }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-12 md:pt-40 md:pb-32 overflow-hidden bg-gray-50">
      <style>{heroStyles}</style>
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 z-0"></div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] lg:w-[900px] h-[600px] lg:h-[900px] bg-primary/1 md:bg-primary/10 lg:bg-primary/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-danger/10 lg:bg-danger/5 rounded-full blur-[100px] translate-y-1/3 pointer-events-none z-0"></div>
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[80px] -translate-x-1/2 pointer-events-none z-0"></div>

      {/* Ghosted Gallery Collage */}
      <div className="absolute top-0 right-0 w-full lg:w-[65%] h-full pointer-events-none overflow-hidden opacity-30 lg:opacity-40 z-0">
        {/* Fade Masks */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-transparent to-gray-50 z-20"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-color z-20"></div>{" "}
        {/* Brand tint overlay */}
        {/* Animated Parent Container (Keeps all images perfectly aligned relative to each other) */}
        <div className="relative w-full h-full animate-float-collage">
          <div className="absolute top-[15%] left-[20%] w-[35%] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl z-10 transform -rotate-3 opacity-90">
            <Image
              src="/images/gallery-ambulance.jpg"
              alt="Ambulance"
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute top-[25%] left-[50%] lg:top-[5%] lg:left-[50%] w-[45%] aspect-square rounded-3xl overflow-hidden shadow-2xl z-10 transform rotate-6 opacity-80">
            <Image
              src="/images/gallery-firefighter.jpg"
              alt="Firefighter"
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute top-[50%] right-[50%] lg:top-[45%] lg:left-[15%] w-[40%] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl z-10 transform -rotate-6 opacity-85">
            <Image
              src="/images/gallery-police.jpg"
              alt="Police"
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute top-[50%] left-[45%] lg:top-[55%] lg:left-[50%] w-[50%] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl z-10 transform rotate-3 opacity-95">
            <Image
              src="/images/gallery-paramedic.jpg"
              alt="Paramedics"
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute left-[35%] top-[40%] lg:top-[80%] lg:left-[25%] w-[30%] aspect-square rounded-3xl overflow-hidden shadow-2xl z-10 transform -rotate-12 opacity-70">
            <Image
              src="/images/gallery-dispatcher.jpg"
              alt="Dispatcher"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="w-full md:w-[70%] lg:w-[60%] xl:w-[55%]">
            <h1 className="text-shadow-sm font-outfit font-bold text-4xl md:text-6xl lg:text-[4.5rem] text-gray-900 mb-8 leading-[1.05] tracking-tight animate-in slide-in-from-bottom-4 duration-500">
              Fast Emergency Assistance <br className="hidden xl:block" />
              <span className="text-primary">When Every Second Counts</span>
            </h1>

            <p className="text-md md:text-xl text-gray-700 mb-10 max-w-[95%] md:max-w-[85%] leading-relaxed animate-in slide-in-from-bottom-4 duration-500 delay-100">
              A reliable platform connecting residents directly with local
              emergency coordinators and first responders. Get the help you
              need, instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 animate-in slide-in-from-bottom-4 duration-500 delay-200">
              <button
                onClick={onRequestAssistance}
                className="body-medium w-full sm:w-auto px-10 py-4 bg-danger hover:bg-danger-hover text-white rounded-xl font-semibold shadow-lg shadow-danger/30 hover:shadow-xl hover:shadow-danger/40 transition-all duration-300 md:text-lg hover:-translate-y-1 active:translate-y-0 active:scale-95 border-t border-white/20 flex items-center justify-center tracking-wide"
              >
                Request Emergency
              </button>

              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="body-medium w-full sm:w-auto px-8 py-4 bg-white/80 backdrop-blur-md border-2 border-gray-200 hover:border-gray-300 hover:bg-white text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all md:text-lg shadow-sm "
              >
                <FiInfo className="w-5 h-5" />
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
