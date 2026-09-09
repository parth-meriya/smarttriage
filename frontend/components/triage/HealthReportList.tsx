'use client';

import React, { useState } from 'react';
import {
  FileText,
  Activity,
  FileSpreadsheet,
  Pill,
  Image as ImageIcon,
  Download,
  Calendar,
  User,
  Plus,
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { HealthReportDto } from '@/lib/api/types';
import { HealthReportUploadModal } from './HealthReportUploadModal';

interface HealthReportListProps {
  reports: HealthReportDto[];
  patientId?: number;
  patientName?: string;
  canUpload?: boolean;
  onReportAdded?: (report: HealthReportDto) => void;
}

export function HealthReportList({
  reports,
  patientId,
  patientName = 'Patient',
  canUpload = false,
  onReportAdded
}: HealthReportListProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReportDto | null>(null);

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case 'Lab Result':
        return {
          icon: <Activity size={14} />,
          color: '#155eef',
          bg: '#eff8ff',
          border: '#d1e9ff',
          label: 'Lab Result'
        };
      case 'Imaging':
        return {
          icon: <ImageIcon size={14} />,
          color: '#7c3aed',
          bg: '#f5f3ff',
          border: '#ddd6fe',
          label: 'Imaging / Scan'
        };
      case 'Prescription':
        return {
          icon: <Pill size={14} />,
          color: '#059669',
          bg: '#ecfdf5',
          border: '#a7f3d0',
          label: 'Prescription'
        };
      case 'Vitals Summary':
        return {
          icon: <Activity size={14} />,
          color: '#d97706',
          bg: '#fffbeb',
          border: '#fde68a',
          label: 'Vitals Summary'
        };
      case 'Discharge Summary':
        return {
          icon: <FileSpreadsheet size={14} />,
          color: '#0891b2',
          bg: '#ecfeff',
          border: '#a5f3fc',
          label: 'Discharge Summary'
        };
      default:
        return {
          icon: <FileText size={14} />,
          color: '#475569',
          bg: '#f8fafc',
          border: '#e2e8f0',
          label: type || 'Clinical Note'
        };
    }
  };

  const handleDownloadFile = (report: HealthReportDto) => {
    if (report.file_url) {
      window.open(report.file_url, '_blank');
    } else if (typeof report.file === 'string' && report.file) {
      window.open(report.file, '_blank');
    } else {
      // Create a text file download of the report details
      const content = `SMARTTRIAGE HEALTH REPORT\n` +
        `=========================\n` +
        `Patient: ${report.patient_name || patientName}\n` +
        `Report Type: ${report.report_type}\n` +
        `Title: ${report.title}\n` +
        `Recorded: ${report.created_at || new Date().toISOString()}\n` +
        `Recorded By: ${report.uploaded_by_name || 'Clinical Staff'}\n\n` +
        `FINDINGS & SUMMARY:\n${report.description || 'N/A'}\n\n` +
        `CLINICAL NOTES:\n${report.notes || 'N/A'}\n`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(report.title || 'report').replace(/\s+/g, '_')}_health_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: '#0f8b8d' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Health & Diagnostic Reports
          </h3>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            background: '#f1f5f9',
            color: '#475569',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {reports.length}
          </span>
        </div>

        {canUpload && patientId && (
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#0f8b8d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <Plus size={14} />
            <span>Add / Upload Report</span>
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div style={{
          padding: '28px 20px',
          textAlign: 'center',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px dashed #cbd5e1'
        }}>
          <FileText size={28} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
          <strong style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
            No Health Reports on File
          </strong>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            {canUpload
              ? 'Nurses and clinical staff can upload diagnostic labs, scans, and notes.'
              : 'Your clinical team has not uploaded any diagnostic files for this visit yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {reports.map((report, idx) => {
            const badge = getReportTypeBadge(report.report_type);
            const dateStr = report.created_at
              ? new Date(report.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recently added';

            return (
              <div
                key={report.id || `rep-${idx}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: badge.color,
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {badge.icon}
                      {badge.label}
                    </span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {report.title}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile(report)}
                    title="View / Download Report"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#334155',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                </div>

                {report.description && (
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#334155',
                    lineHeight: 1.45,
                    background: '#f8fafc',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #f1f5f9'
                  }}>
                    {report.description}
                  </p>
                )}

                {report.notes && (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <strong>Note:</strong> {report.notes}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  borderTop: '1px solid #f8fafc',
                  paddingTop: '6px',
                  marginTop: '2px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {dateStr}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} /> {report.uploaded_by_name || 'Staff Nurse'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {patientId && (
        <HealthReportUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          patientId={patientId}
          patientName={patientName}
          onReportUploaded={(rep) => {
            if (onReportAdded) {
              onReportAdded(rep);
            }
          }}
        />
      )}
    </div>
  );
}
