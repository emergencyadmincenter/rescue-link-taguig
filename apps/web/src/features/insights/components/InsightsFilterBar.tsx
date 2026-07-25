"use client";

import { IncidentCategory } from "../api/insights.api";
import { TAGUIG_BARANGAYS } from "@/lib/barangays";

interface Filters {
  dateFrom: string;
  dateTo: string;
  barangay: string;
  incidentCategoryId: string;
}

interface Props {
  filters: Filters;
  categories: IncidentCategory[];
  onFilterChange: (filters: Filters) => void;
  isLoading?: boolean;
}

export function InsightsFilterBar({ filters, categories, onFilterChange, isLoading }: Props) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
        <label className="body-small font-medium text-gray-600">Date From</label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50"
          value={filters.dateFrom}
          onChange={(e) => handleChange("dateFrom", e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
        <label className="body-small font-medium text-gray-600">Date To</label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50"
          value={filters.dateTo}
          onChange={(e) => handleChange("dateTo", e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
        <label className="body-small font-medium text-gray-600">Barangay</label>
        <select
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50 bg-white"
          value={filters.barangay}
          onChange={(e) => handleChange("barangay", e.target.value)}
          disabled={isLoading}
        >
          <option value="">All Barangays</option>
          {TAGUIG_BARANGAYS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
        <label className="body-small font-medium text-gray-600">Incident Type</label>
        <select
          className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50 bg-white"
          value={filters.incidentCategoryId}
          onChange={(e) => handleChange("incidentCategoryId", e.target.value)}
          disabled={isLoading}
        >
          <option value="">All Types</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id} className="capitalize">
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
