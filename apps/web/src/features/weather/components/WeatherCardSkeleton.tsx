"use client";

export default function WeatherCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 animate-pulse">
      {/* Header: Icon + Name */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-gray-100 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2 pt-0.5">
          <div className="h-4 bg-gray-100 rounded-md w-3/4" />
          <div className="h-3 bg-gray-100 rounded-md w-1/2" />
        </div>
      </div>

      {/* Temperature */}
      <div className="flex items-baseline gap-2">
        <div className="h-8 w-16 bg-gray-100 rounded-md" />
        <div className="h-3 w-24 bg-gray-100 rounded-md" />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-14 bg-gray-100 rounded-md" />
            <div className="h-3.5 w-20 bg-gray-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="pt-1 border-t border-gray-100">
        <div className="h-3 w-28 bg-gray-100 rounded-md" />
      </div>
    </div>
  );
}
