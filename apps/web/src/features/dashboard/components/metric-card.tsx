import Link from "next/link";
import { ReactNode } from "react";
import { FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  href?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  href,
  className = "",
}: MetricCardProps) {
  const CardContent = (
    <div
      className={`bg-background rounded-xl p-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-subtle transition-all duration-300 relative overflow-hidden group ${className}`}
    >
      <div className="flex justify-between items-start mb-md">
        <h3 className="text-gray-500 font-medium body-small uppercase tracking-wider">
          {title}
        </h3>
        <div className="p-xs bg-background-subtle rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-sm">
        <span className="display-medium text-foreground tracking-tight">{value}</span>
        
        {trend && trendValue && (
          <div
            className={`flex items-center gap-xs body-xsmall font-medium px-2 py-0.5 rounded-full ${
              trend === "up"
                ? "bg-success/10 text-success"
                : trend === "down"
                ? "bg-danger/10 text-danger"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {trend === "up" && <FiTrendingUp className="w-3 h-3" />}
            {trend === "down" && <FiTrendingDown className="w-3 h-3" />}
            {trend === "neutral" && <FiMinus className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block interactive">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
