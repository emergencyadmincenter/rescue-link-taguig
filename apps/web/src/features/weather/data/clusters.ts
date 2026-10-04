/**
 * Emergency Command Center — Cluster Assignments
 *
 * Taguig City's 38 barangays are organized into 5 operational clusters
 * for coordinated emergency response. Each cluster groups geographically
 * adjacent barangays under a single command post/rescue team.
 *
 * Cluster Organization:
 *   - Cluster 1 (District 1 – North): Tipas area + adjacent barangays
 *   - Cluster 2 (District 1 – Central): Bicutan area + adjacent barangays
 *   - Cluster 3 (District 2 – West): Fort Bonifacio + Signal Villages area
 *   - Cluster 4 (District 2 – South): Upper Bicutan + Daang Hari area
 *   - Cluster 5 (Embo Barangays): All Embo barangays
 *
 * // TODO: BACKEND — This cluster assignment is currently static/hardcoded
 * // from an internal command center document, and should eventually be
 * // confirmed against or served by the real backend if cluster assignments
 * // can change. The backend should expose an endpoint like GET /api/clusters
 * // that returns the current cluster configuration, allowing operational
 * // commanders to reassign barangays between clusters as situations evolve.
 */

// --- Types ---

export interface ClusterConfig {
  /** Cluster identifier (1-based) */
  id: number;
  /** Display label, e.g. "Cluster 1" */
  label: string;
  /** Short description of the geographic area covered */
  area: string;
  /** Fill color for map polygons (hex) */
  color: string;
  /** Darker border color for cluster outlines (hex) */
  borderColor: string;
  /** Lighter background for legend/badge (Tailwind class) */
  bgClass: string;
  /** Text color for legend/badge (Tailwind class) */
  textClass: string;
  /** Dot/indicator color (Tailwind class) */
  dotClass: string;
  /** Border color for legend/badge (Tailwind class) */
  borderClass: string;
  /** Barangay names belonging to this cluster (matches mock data `name` field) */
  barangays: string[];
  /**
   * Mock rescue team/unit assigned to this cluster.
   * // TODO: BACKEND — Replace with real assignment from the backend.
   * // Should support dynamic reassignment during operations.
   */
  /**
   * Mock command post location for this cluster.
   * // TODO: BACKEND — Replace with real command post data.
   */
}

// --- Cluster Color Palette ---
// 5 visually distinct colors that work well on a map and remain
// distinguishable for color-vision-deficient users.
// Each cluster gets a fill color (for polygons), a darker border color
// (for cluster outlines), and Tailwind classes for legend badges.

const DULL_GRAY = {
  color: '#6b7280',
  borderColor: '#4b5563',
  bgClass: 'bg-gray-100',
  textClass: 'text-gray-700',
  dotClass: 'bg-gray-500',
  borderClass: 'border-gray-200'
};
const CLUSTER_COLORS = [DULL_GRAY, DULL_GRAY, DULL_GRAY, DULL_GRAY, DULL_GRAY] as const;

// --- Cluster Definitions ---

/**
 * All 5 Emergency Command Center clusters.
 *
 * Barangay names must match the `name` field in the weather mock data
 * (weather.mock.ts). The GEOJSON_TO_DATA_NAME mapping in WeatherMapView
 * handles any GeoJSON ↔ mock data name mismatches separately.
 *
 * // TODO: BACKEND — When served by the backend, barangay membership
 * // should be validated against the canonical barangay list to prevent
 * // orphaned or duplicate assignments.
 */
export const CLUSTERS: ClusterConfig[] = [
  {
    id: 1,
    label: "Cluster 1",
    area: "District 1 – North (Tipas Area)",
    barangays: [
      "Napindan",
      "Ibayo-Tipas",
      "Ligid-Tipas",
      "Palingon-Tipas", // Note: GeoJSON has "Palingon", mock data has "Palingon-Tipas"
      "Calzada",
      "Santa Ana",
      "Tuktukan",
      "Ususan",
    ],
    ...CLUSTER_COLORS[0],
  },
  {
    id: 2,
    label: "Cluster 2",
    area: "District 1 – Central (Bicutan Area)",
    barangays: [
      "San Miguel",
      "Wawa",
      "Bambang",
      "Hagonoy",
      "Lower Bicutan",
      "New Lower Bicutan",
      "Bagumbayan",
    ],
    ...CLUSTER_COLORS[1],
  },
  {
    id: 3,
    label: "Cluster 3",
    area: "District 2 – West (BGC & Signal Villages)",
    barangays: [
      "Fort Bonifacio",
      "Katuparan",
      "Pinagsama",
      "Western Bicutan",
      "North Signal Village",
      "Central Signal Village",
      "South Signal Village",
    ],
    ...CLUSTER_COLORS[2],
  },
  {
    id: 4,
    label: "Cluster 4",
    area: "District 2 – South (Daang Hari Area)",
    barangays: [
      "Maharlika Village",
      "Upper Bicutan",
      "Central Bicutan",
      "South Daang Hari",
      "North Daang Hari",
      "Tanyag",
    ],
    ...CLUSTER_COLORS[3],
  },
  {
    id: 5,
    label: "Cluster 5",
    area: "Embo Barangays",
    barangays: [
      "West Rembo",
      "Pembo",
      "South Cembo",
      "Post Proper Southside",
      "Cembo",
      "East Rembo",
      "Rizal",
      "Post Proper Northside",
      "Pitogo",
      "Comembo",
    ],
    ...CLUSTER_COLORS[4],
  },
];

// --- Utility Functions ---

/**
 * Lookup map: barangay name (lowercase) → ClusterConfig.
 * Built once at module load for O(1) lookups during rendering.
 */
const barangayToClusterMap = new Map<string, ClusterConfig>();
for (const cluster of CLUSTERS) {
  for (const name of cluster.barangays) {
    barangayToClusterMap.set(name.toLowerCase(), cluster);
  }
}

/**
 * Returns the cluster a barangay belongs to, or undefined if not assigned.
 * Accepts the barangay display name (case-insensitive).
 */
export function getClusterForBarangay(
  barangayName: string,
): ClusterConfig | undefined {
  return barangayToClusterMap.get(barangayName.toLowerCase());
}

/**
 * Returns all cluster IDs as a simple array for filter dropdowns.
 */
export function getClusterIds(): number[] {
  return CLUSTERS.map((c) => c.id);
}

/**
 * Returns a cluster config by its numeric ID.
 */
export function getClusterById(id: number): ClusterConfig | undefined {
  return CLUSTERS.find((c) => c.id === id);
}
