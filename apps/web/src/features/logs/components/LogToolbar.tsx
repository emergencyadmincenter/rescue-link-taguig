"use client";

import { FiSearch, FiCalendar } from "react-icons/fi";
import { BiFilterAlt } from "react-icons/bi";

interface LogToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  onDateClick: () => void;
  onAddClick: () => void;
  dateLabel: string;
}

export default function LogToolbar({
  search,
  onSearchChange,
  onFilterClick,
  onDateClick,
  onAddClick,
  dateLabel,
}: LogToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search Request ID, Name, Phone, Description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-5 pr-10 py-4 border border-gray-200 rounded-full body-small focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-gray-700 placeholder:text-gray-400"
        />
        <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[15px] h-[15px]" />
      </div>

      {/* Date Filter Button */}
      <button
        onClick={onDateClick}
        title="Filter by Date"
        className={`flex items-center gap-2 px-4 py-2 border rounded-full body-small transition-all duration-200 shrink-0 ${
          dateLabel
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`}
      >
        <FiCalendar className="w-4 h-4" />
        {dateLabel || "Date Range"}
      </button>

      {/* Filter Button */}
      <button
        onClick={onFilterClick}
        title="Filter Status & Source"
        className="text-gray-500 hover:text-gray-700 transition-colors duration-200 shrink-0 p-2 rounded-full hover:bg-gray-50"
      >
        <BiFilterAlt className="w-[20px] h-[20px]" />
      </button>

      {/* Add Button */}
      <button
        onClick={onAddClick}
        title="Add Log"
        className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center transition-all duration-200 shrink-0 text-[18px] leading-none font-light shadow-sm"
      >
        +
      </button>
    </div>
  );
}
