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
  priority_label?: string;
  vital: string;
  wait: string;
  status: string;
  room: string;
  arrived_at: string;
  estimated_wait_minutes?: number;
  queue_position?: number;
  patients_ahead?: number;
  called_at?: string | null;
}

/** Backend-computed live queue snapshot for the authenticated patient. */
export interface MyQueueStatusDto {
  ticket_id: number;
  patient_id: number;
  patient_name: string;
  ticket_number: string;
  priority: PriorityLevel;
  status: string;
  queue_position: number;
  patients_ahead: number;
  estimated_wait_minutes: number;
  average_consultation_minutes: number;
  next_step?: string;
  banner?: string;
  arrived_at?: string;
  called_at?: string | null;
  completed_at?: string | null;
}

/** Backend-decided next eligible patient for the doctor. */
export interface NextPatientDto {
  ticket_id: number;
  patient_id: number;
  patient_name: string;
  ticket_number: string;
  priority: PriorityLevel;
  status: string;
  queue_position: number;
  patients_ahead: number;
  estimated_wait_minutes: number;
  complaint?: string;
  is_emergency?: boolean;
  room?: string;
  age?: number;
  gender?: string;
}

export interface VisitDto {
  id: number;
  visit_number: string;
  patient: number;
  patient_name: string;
  patient_mrn: string;
  chief_complaint: string;
  status: string;
  priority: PriorityLevel;
  assigned_doctor?: number;
  assigned_doctor_name?: string;
  facility?: number;
  is_completed: boolean;
  created_at: string;
  completed_at?: string;
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
    triage_in_progress?: number;
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

export interface ConsultationDto {
  id?: number;
  patient: number;
  patient_name?: string;
  doctor?: number;
  doctor_name?: string;
  started_at?: string;
  completed_at?: string;
  chief_complaint: string;
  clinical_findings?: string;
  diagnosis?: string;
  treatment_plan?: string;
  disposition?: 'Discharged' | 'Admitted' | 'Observation' | 'Transferred';
}

export interface HealthReportDto {
  id?: number;
  patient: number;
  patient_name?: string;
  visit?: number;
  uploaded_by?: number;
  uploaded_by_name?: string;
  report_type: 'Lab Result' | 'Imaging' | 'Prescription' | 'Discharge Summary' | 'Vitals Summary' | 'Clinical Note' | 'Other';
  title: string;
  description?: string;
  file?: string | File | null;
  file_url?: string;
  notes?: string;
  created_at?: string;
}

export interface PatientHistoryResponse {
  patient: any;
  vitals: VitalSignDto[];
  triage_history: TriageAssessmentDto[];
  visits: QueueTicketDto[];
  reports?: HealthReportDto[];
}


