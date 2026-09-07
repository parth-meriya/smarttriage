import { apiClient } from './client';
import {
  LiveQueueResponse,
  OperationsMetricsResponse,
  QueueTicketDto,
  TriageAssessmentDto,
  VitalSignDto,
  AIAssessmentResponse,
  VisitDto,
} from './types';

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001/api/v1';

export const triageApi = {
  // Live Queue
  getLiveQueue: async (): Promise<LiveQueueResponse> => {
    return apiClient<LiveQueueResponse>('/triage/queue/live_feed/');
  },

  callPatient: async (ticketId: number): Promise<QueueTicketDto> => {
    return apiClient<QueueTicketDto>(`/triage/queue/${ticketId}/call_patient/`, {
      method: 'POST',
    });
  },

  completeTicket: async (ticketId: number): Promise<{ status: string }> => {
    return apiClient<{ status: string }>(`/triage/queue/${ticketId}/complete/`, {
      method: 'POST',
    });
  },

  // Patients
  getPatients: async (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient(`/triage/patients/${query}`);
  },

  getPatient: async (patientId: number) => {
    return apiClient(`/triage/patients/${patientId}/`);
  },

  createPatient: async (patientData: any) => {
    return apiClient('/triage/patients/', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  updatePatient: async (patientId: number, patientData: any) => {
    return apiClient(`/triage/patients/${patientId}/`, {
      method: 'PATCH',
      body: JSON.stringify(patientData),
    });
  },

  getPatientHistory: async (patientId: number) => {
    return apiClient(`/triage/patients/${patientId}/history/`);
  },

  // Visits
  getVisits: async (patientId?: number): Promise<VisitDto[]> => {
    const query = patientId ? `?patient=${patientId}` : '';
    return apiClient<VisitDto[]>(`/triage/visits/${query}`);
  },

  getVisit: async (visitId: number): Promise<VisitDto> => {
    return apiClient<VisitDto>(`/triage/visits/${visitId}/`);
  },

  createVisit: async (data: Partial<VisitDto>): Promise<VisitDto> => {
    return apiClient<VisitDto>('/triage/visits/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  completeVisit: async (visitId: number): Promise<VisitDto> => {
    return apiClient<VisitDto>(`/triage/visits/${visitId}/complete_visit/`, {
      method: 'POST',
    });
  },

  // Vitals & Triage
  recordVitals: async (vitals: VitalSignDto): Promise<VitalSignDto> => {
    return apiClient<VitalSignDto>('/triage/vitals/', {
      method: 'POST',
      body: JSON.stringify(vitals),
    });
  },

  submitTriage: async (assessment: TriageAssessmentDto): Promise<TriageAssessmentDto> => {
    return apiClient<TriageAssessmentDto>('/triage/assessments/', {
      method: 'POST',
      body: JSON.stringify(assessment),
    });
  },

  // Operations / Admin Analytics
  getOperationsMetrics: async (): Promise<OperationsMetricsResponse> => {
    return apiClient<OperationsMetricsResponse>('/analytics/operations/');
  },

  // AI Decision Support Microservice
  evaluateWithAI: async (data: any): Promise<AIAssessmentResponse> => {
    const response = await fetch(`${AI_BASE_URL}/triage/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('AI evaluation failed');
    return response.json();
  },

  askAssistant: async (data: { patient_name: string; complaint: string; question: string }): Promise<{ answer: string }> => {
    const response = await fetch(`${AI_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('AI Assistant request failed');
    return response.json();
  },
};
