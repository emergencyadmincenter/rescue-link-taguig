"use client";

import { Resource } from "../types/logs.types";

interface NeedsSelectorProps {
  resources: Resource[];
  selectedIds: string[];
  onToggle: (resourceId: string) => void;
  readOnly?: boolean;
}

export default function NeedsSelector({
  resources,
  selectedIds,
  onToggle,
  readOnly,
}: NeedsSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {resources.map((resource) => {
        const isSelected = selectedIds.includes(resource.id);
        return (
          <button
            key={resource.id}
            type="button"
            onClick={() => !readOnly && onToggle(resource.id)}
            disabled={readOnly}
            className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 transition-all ${
              isSelected
                ? "border-danger text-danger bg-danger/5"
                : "border-background-subtle text-foreground/70 hover:border-foreground/30"
            } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          >
            {resource.name}
          </button>
        );
      })}
    </div>
  );
}
