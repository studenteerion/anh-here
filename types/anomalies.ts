/**
 * Anomaly domain types
 */

export interface Anomaly {
  id: number;
  description: string;
  created_at: Date;
  reporter_id: number;
  resolver_id: number | null;
  status: "open" | "in_progress" | "closed";
  resolution_notes: string | null;
  resolved_at: Date | null;
}

export interface AnomalyFilter {
  status?: Anomaly["status"];
  limit?: number;
  offset?: number;
}

export interface AnomalyResponse {
  id: number;
  description: string;
  status: string;
  reportedAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
}
