import { FiTruck, FiActivity, FiPackage, FiTool, FiChevronRight } from "react-icons/fi";
import Link from "next/link";

export interface ResourceSummary {
  category: "responder" | "medical" | "relief" | "utility";
  available: number;
  total: number;
}

interface ResourceStatusWidgetProps {
  resources: ResourceSummary[];
  className?: string;
}

const CategoryIcons = {
  responder: <FiTruck className="w-5 h-5 text-info-hover" />,
  medical: <FiActivity className="w-5 h-5 text-danger" />,
  relief: <FiPackage className="w-5 h-5 text-warning-hover" />,
  utility: <FiTool className="w-5 h-5 text-gray-500" />,
};

const CategoryLabels = {
  responder: "Response Teams",
  medical: "Medical Assets",
  relief: "Relief Goods",
  utility: "Utility Assets",
};

export function ResourceStatusWidget({ resources, className = "" }: ResourceStatusWidgetProps) {
  return (
    <div className={`bg-background rounded-xl border border-gray-100 shadow-sm flex flex-col ${className}`}>
      <div className="p-lg border-b border-gray-100 bg-background-subtle rounded-t-xl flex justify-between items-center">
        <h2 className="title-medium text-foreground">Resource Availability</h2>
      </div>

      <div className="p-md grid grid-cols-1 gap-2 flex-1">
        {resources.map((resource) => {
          const percentage = resource.total > 0 ? (resource.available / resource.total) * 100 : 0;
          
          let barColor = "bg-success";
          let bgTrack = "bg-success-foreground/20";
          if (percentage < 25) {
            barColor = "bg-danger";
            bgTrack = "bg-danger/10";
          } else if (percentage < 60) {
            barColor = "bg-warning";
            bgTrack = "bg-warning-subtle";
          }

          return (
            <Link 
              href={`/resources?category=${resource.category}`}
              key={resource.category} 
              className="flex flex-col gap-sm p-sm rounded-lg hover:bg-background-subtle border border-transparent hover:border-gray-100 transition-all duration-200 interactive group"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-sm">
                  <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-50 group-hover:shadow-md transition-shadow">
                    {CategoryIcons[resource.category]}
                  </div>
                  <span className="body-medium font-medium text-foreground">
                    {CategoryLabels[resource.category]}
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  <div className="body-small font-semibold text-right">
                    <span className="text-foreground">{resource.available}</span>
                    <span className="text-gray-400"> / {resource.total}</span>
                  </div>
                  <FiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
              
              <div className={`h-1.5 w-full ${bgTrack} rounded-full overflow-hidden mt-1`}>
                <div 
                  className={`h-full ${barColor} transition-all duration-700 ease-out`} 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
