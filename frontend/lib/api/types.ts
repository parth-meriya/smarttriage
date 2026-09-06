export type PriorityLevel = 1 | 2 | 3 | 4;
export type UserRole = 'Doctor' | 'Nurse' | 'Admin' | 'Patient';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  initials: string;
  department: string;
  license_number?: string;
  phone_number?: string;
  is_available: boolean;
  display_name: string;
}

export interface VitalSignDto {
  id?: number;
  patient: number;
  spo2?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  temperature?: number | string;
  is_critical?: boolean;
  recorded_at?: string;
  display_vital?: string;
  bp_display?: string;
}

export interface TriageAssessmentDto {
  id?: number;
  patient: number;
  priority: PriorityLevel;
  primary_complaint: string;
  symptom_onset: string;
  severe_breathing_difficulty: boolean;
  chest_pain_or_pressure: boolean;
  slurred_speech_or_weakness: boolean;
  clinical_notes?: string;
  ai_suggested_priority?: PriorityLevel;
  ai_rationale?: string;
  ai_summary?: string;
  created_at?: string;
}

export interface QueueTicketDto {
  id: number;
  ticket_number: string;
  patient_id: number;
  name: string;
  initials: string;
  age: number;
  gender: string;
  complaint: string;
  priority: PriorityLevel;
  vital: string;
  wait: string;
  status: string;
  room: string;
  arrived_at: string;
  estimated_wait_minutes: number;
}

export interface LiveQueueResponse {
  all: QueueTicketDto[];
  attention: QueueTicketDto[];
  waiting: QueueTicketDto[];
  counts: {
    emergency: number;
    high_priority: number;
    urgent: number;
    non_urgent: number;
    total_waiting: number;
  };
}

export interface OperationsMetricsResponse {
  operations: {
    arrivals: number;
    arrivals_delta: string;
    waiting: number;
    waiting_subtext: string;
    in_triage: number;
    in_triage_subtext: string;
    with_doctor: number;
    with_doctor_subtext: string;
    completed: number;
    completed_subtext: string;
  };
  queue_overview: Array<{
    label: string;
    count: number;
    color: string;
  }>;
  recent_activity: Array<{
    id: number;
    time_display: string;
    event_type: string;
    patient_name: string;
    description: string;
  }>;
}

export interface AIAssessmentResponse {
  suggested_priority: PriorityLevel;
  priority_code: string;
  priority_label: string;
  patient_summary: string;
  urgency_rationale: string;
  key_risk_factors: string[];
  clinical_review_required: boolean;
  disclaimer: string;
}
