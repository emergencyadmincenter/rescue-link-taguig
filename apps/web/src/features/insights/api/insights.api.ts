import apiClient from "@/lib/api-client";

export interface InsightsIncident {
  id: string;
  reference_no: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  incident_type: string | null;
  barangay: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface InsightsResponseTime {
  barangay: string;
  avg_response_time_seconds: number;
  total_resolved: number;
}

export interface InsightsWorkload {
  coordinator_id: string;
  coordinator_name: string;
  handled_cases: number;
}

export interface InsightsPeakTime {
  dayOfWeek: number;
  hourOfDay: number;
  count: number;
}

export interface IncidentCategory {
  id: string;
  name: string;
}

export const insightsApi = {
  getIncidents: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    barangay?: string;
    incidentCategoryId?: string;
  }): Promise<InsightsIncident[]> => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.append("date_from", params.dateFrom);
    if (params?.dateTo) searchParams.append("date_to", params.dateTo);
    if (params?.barangay) searchParams.append("barangay", params.barangay);
    if (params?.incidentCategoryId) searchParams.append("incident_category_id", params.incidentCategoryId);

    const queryStr = searchParams.toString();
    const url = `/insights/incidents${queryStr ? `?${queryStr}` : ""}`;

    const res = await apiClient.get(url);
    return res.data.data;
  },

  getResponseTimes: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    barangay?: string;
    incidentCategoryId?: string;
  }): Promise<InsightsResponseTime[]> => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.append("date_from", params.dateFrom);
    if (params?.dateTo) searchParams.append("date_to", params.dateTo);
    if (params?.barangay) searchParams.append("barangay", params.barangay);
    if (params?.incidentCategoryId) searchParams.append("incident_category_id", params.incidentCategoryId);
    const queryStr = searchParams.toString();
    const res = await apiClient.get(`/insights/response-times${queryStr ? `?${queryStr}` : ""}`);
    return res.data.data;
  },

  getWorkload: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    barangay?: string;
    incidentCategoryId?: string;
  }): Promise<InsightsWorkload[]> => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.append("date_from", params.dateFrom);
    if (params?.dateTo) searchParams.append("date_to", params.dateTo);
    if (params?.barangay) searchParams.append("barangay", params.barangay);
    if (params?.incidentCategoryId) searchParams.append("incident_category_id", params.incidentCategoryId);
    const queryStr = searchParams.toString();
    const res = await apiClient.get(`/insights/workload${queryStr ? `?${queryStr}` : ""}`);
    return res.data.data;
  },

  getPeakTimes: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    barangay?: string;
    incidentCategoryId?: string;
  }): Promise<InsightsPeakTime[]> => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.append("date_from", params.dateFrom);
    if (params?.dateTo) searchParams.append("date_to", params.dateTo);
    if (params?.barangay) searchParams.append("barangay", params.barangay);
    if (params?.incidentCategoryId) searchParams.append("incident_category_id", params.incidentCategoryId);
    const queryStr = searchParams.toString();
    const res = await apiClient.get(`/insights/peak-times${queryStr ? `?${queryStr}` : ""}`);
    return res.data.data;
  },

  getIncidentCategories: async (): Promise<IncidentCategory[]> => {
    const res = await apiClient.get("/insights/incident-categories");
    return res.data.data;
  },
};
