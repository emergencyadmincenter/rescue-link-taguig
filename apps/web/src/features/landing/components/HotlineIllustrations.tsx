import React from "react";

export const SirenIllustration = () => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <div className="absolute inset-0 bg-danger/20 rounded-full animate-ping opacity-75 duration-1000"></div>
    <div className="absolute inset-2 bg-danger/40 rounded-full animate-pulse"></div>
    <svg className="w-8 h-8 text-danger relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  </div>
);

export const PoliceIllustration = () => (
  <div className="relative w-16 h-16 flex items-center justify-center overflow-hidden rounded-full bg-blue-600/10">
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
    <svg className="w-8 h-8 text-blue-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  </div>
);

export const FireIllustration = () => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <div className="absolute bottom-2 w-10 h-10 bg-orange-500/20 rounded-full blur-md animate-pulse"></div>
    <svg className="w-8 h-8 text-orange-500 relative z-10 animate-bounce" style={{ animationDuration: '2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  </div>
);

export const AmbulanceIllustration = () => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <svg className="w-8 h-8 text-rose-500 relative z-10 animate-pulse" style={{ animationDuration: '1s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
    <div className="absolute inset-0 border-2 border-rose-500/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
  </div>
);

export const DisasterIllustration = () => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <div className="absolute inset-0 bg-emerald-600/10 rounded-xl animate-spin" style={{ animationDuration: '4s' }}></div>
    <svg className="w-8 h-8 text-emerald-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
);

export const CoastGuardIllustration = () => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <div className="absolute inset-2 border-4 border-cyan-600/30 rounded-full border-t-cyan-600 animate-spin" style={{ animationDuration: '3s' }}></div>
    <svg className="w-8 h-8 text-cyan-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  </div>
);

export const HotlinesHeroIllustration = () => (
  <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gray-900 border-4 border-gray-50 flex items-center justify-center shadow-xl">
    {/* Grid Background */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    
    {/* Animated Radar/Signal Rings */}
    <div className="absolute w-[150%] h-[150%] border-[1px] border-gray-700/50 rounded-full scale-100"></div>
    <div className="absolute w-[100%] h-[100%] border-[1px] border-gray-700/50 rounded-full scale-100"></div>
    <div className="absolute w-[50%] h-[50%] border-[1px] border-gray-700/50 rounded-full scale-100"></div>

    {/* Pulsing Signal Waves */}
    <div className="absolute w-64 h-64 border-2 border-danger/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
    <div className="absolute w-48 h-48 border-2 border-danger/50 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
    <div className="absolute w-32 h-32 border-2 border-primary/40 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }}></div>

    {/* Floating Data Nodes */}
    <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>
    <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]" style={{ animationDelay: '1s' }}></div>
    <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-orange-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,146,60,0.8)]" style={{ animationDelay: '0.5s' }}></div>

    {/* Center Element: Glowing Emergency Phone UI */}
    <div className="relative z-10 w-28 h-44 bg-gray-800 border-2 border-gray-700 rounded-2xl shadow-2xl flex flex-col items-center p-3 overflow-hidden">
      {/* Screen gradient glow */}
      <div className="absolute top-0 inset-x-0 h-2/3 bg-gradient-to-b from-danger/20 to-transparent"></div>
      
      {/* Phone Screen Map Mockup */}
      <div className="w-full h-full border border-gray-700/50 rounded-xl bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Central glowing shield icon */}
        <div className="relative w-12 h-12 bg-danger rounded-full flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.8)] z-10">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        
        {/* Fake UI bars */}
        <div className="absolute bottom-4 flex flex-col items-center gap-1.5 w-full px-4">
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
             <div className="w-2/3 h-full bg-danger animate-pulse"></div>
          </div>
          <div className="w-3/4 h-1.5 bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
);
