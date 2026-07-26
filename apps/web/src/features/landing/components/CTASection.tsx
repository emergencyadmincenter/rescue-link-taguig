import React from "react";


interface CTASectionProps {
  onRequestAssistance: () => void;
}

export function CTASection({ onRequestAssistance }: CTASectionProps) {
  return (
    <section className="py-16 md:py-18 lg:py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5"></div>
      <div className="max-w-[1400px] mx-auto px-3 md:px-8 lg:px-12 relative z-10">
        <div className="bg-gray-900 rounded-[2rem] p-10 md:p-16 lg:p-20 text-center shadow-2xl shadow-gray-900/20 border border-gray-800 relative overflow-hidden w-full">
          <div className="absolute bottom-0 right-0 -mt-10 -mr-10 w-60 h-25 bg-primary/80 rounded-full blur-2xl z-0"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-60 h-25 bg-danger/80 rounded-full blur-2xl z-0"></div>

          <h2 className="font-outfit font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-6 tracking-tight">
            Ready to Get Help?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-12 mx-auto leading-relaxed">
            Don't wait. If you are experiencing an emergency, our coordinators
            and responders are ready to assist you immediately.
          </p>

          <button
            onClick={onRequestAssistance}
            className="relative z-10 w-full sm:w-max mx-auto px-10 py-5 bg-danger hover:bg-danger-hover text-white rounded-xl font-semibold shadow-lg shadow-danger/30 hover:shadow-xl hover:shadow-danger/40 transition-all duration-300 md:text-xl hover:-translate-y-1 active:translate-y-0 active:scale-95 border-t border-white/20 flex items-center justify-center tracking-wide"
          >
            Request Emergency
          </button>
        </div>
      </div>
    </section>
  );
}
