import React, { useState } from 'react';
import { FiFileText, FiLoader } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { BarangayWeather } from '../types/weather.types';
import { CLUSTERS, getClusterForBarangay } from '../data/clusters';
import { calculateFloodRisk, getFloodRiskConfig } from '../utils/flood-risk';

const CONDITION_LABELS: Record<string, string> = {
  sunny: 'Sunny',
  partly_cloudy: 'Partly Cloudy',
  cloudy: 'Cloudy',
  overcast: 'Overcast',
  light_rain: 'Light Rain',
  heavy_rain: 'Heavy Rain',
  thunderstorm: 'Thunderstorm',
};

interface ExportReportButtonProps {
  weatherData: BarangayWeather[];
}

export function ExportReportButton({ weatherData }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // TODO: BACKEND - This report currently exports whatever mock/cached data is loaded in the client-side state. A production implementation should hit a backend endpoint (e.g. POST /api/reports/weather) that generates a verified, timestamped snapshot from the server's authoritative data, logs the export event for audit purposes, and optionally stores the report for later retrieval.
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('WEATHER SITUATION REPORT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('RescueLink Taguig Emergency Response System', pageWidth / 2, 26, { align: 'center' });
      
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(`Generated: ${formattedDate}`, pageWidth / 2, 32, { align: 'center' });
      
      // Cluster Summary Data Preparation
      const clusterStats = CLUSTERS.map(cluster => {
        const clusterBarangays = weatherData.filter(
          w => getClusterForBarangay(w.name)?.id === cluster.id
        );
        
        let severeCount = 0;
        let advisoryCount = 0;
        let floodRiskCount = 0;
        
        clusterBarangays.forEach(w => {
          if (w.severity === 'severe') severeCount++;
          if (w.severity === 'advisory' || w.severity === 'warning') advisoryCount++;
          
          const riskResult = calculateFloodRisk(w);
          if (riskResult.level === 'high' || riskResult.level === 'elevated') floodRiskCount++;
        });
        
        return [
          cluster.label,
          cluster.area,
          severeCount.toString(),
          advisoryCount.toString(),
          floodRiskCount.toString(),
          clusterBarangays.length.toString()
        ];
      });

      // Cluster Summary Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cluster Summary', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Cluster', 'Area', 'Severe', 'Advisory', 'High/Critical Flood Risk', 'Total Barangays']],
        body: clusterStats,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
      });
      
      // Barangay Detail Table Preparation
      const tableData = weatherData.map(w => {
        const cluster = getClusterForBarangay(w.name);
        const clusterName = cluster ? cluster.label : 'Unknown';
        const condition = CONDITION_LABELS[w.condition] || w.condition;
        const riskResult = calculateFloodRisk(w);
        const riskConfig = getFloodRiskConfig(riskResult.level);
        
        return [
          w.name,
          clusterName,
          w.temperature.toString(),
          condition,
          w.severity.charAt(0).toUpperCase() + w.severity.slice(1),
          w.precipitationChance.toString(),
          w.precipitation.toString(),
          riskConfig.label,
          `${w.windSpeed} km/h ${w.windDirection}`
        ];
      });

      // Barangay Detail Table
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Barangay', 'Cluster', 'Temp (C)', 'Condition', 'Severity', 'Rain Chance (%)', 'Precip (mm)', 'Flood Risk', 'Wind']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 8 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 4) {
            const severity = data.cell.raw as string;
            if (severity === 'Severe') {
              data.cell.styles.fillColor = [254, 226, 226]; // red-100
              data.cell.styles.textColor = [153, 27, 27]; // red-800
            } else if (severity === 'Advisory' || severity === 'Warning') {
              data.cell.styles.fillColor = [254, 249, 195]; // yellow-100
              data.cell.styles.textColor = [133, 77, 14]; // yellow-800
            }
          }
        }
      });
      
      // Footer with page numbers and disclaimer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          'Note: Data shown is for situational awareness based on current readings.',
          14,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
      
      // Format filename
      const pad = (n: number) => n.toString().padStart(2, '0');
      const filename = `Weather_Report_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
      
      // Adding a small timeout to allow UI to show loading state if doc generation is very fast but saving takes a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      doc.save(filename);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white body-xsmall font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Export Situation Report"
    >
      {isExporting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiFileText className="w-4 h-4" />}
      Export Report
    </button>
  );
}
