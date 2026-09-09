'use client';

import React, { useState } from 'react';
import { FileUp, X, UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { triageApi } from '@/lib/api/services';
import { HealthReportDto } from '@/lib/api/types';

interface HealthReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  onReportUploaded?: (report: HealthReportDto) => void;
}

export function HealthReportUploadModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onReportUploaded
}: HealthReportUploadModalProps) {
  const [reportType, setReportType] = useState<HealthReportDto['report_type']>('Lab Result');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Please provide a report title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let createdReport: HealthReportDto;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('patient', String(patientId));
        formData.append('report_type', reportType);
        formData.append('title', title.trim());
        if (description) formData.append('description', description.trim());
        if (notes) formData.append('notes', notes.trim());
        formData.append('file', selectedFile);

        createdReport = await triageApi.uploadHealthReport(formData);
      } else {
        createdReport = await triageApi.createHealthReportJson({
          patient: patientId,
          report_type: reportType,
          title: title.trim(),
          description: description.trim(),
          notes: notes.trim(),
        });
      }

      setSuccess(true);
      if (onReportUploaded) {
        onReportUploaded(createdReport);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccess(false);
        setTitle('');
        setDescription('');
        setNotes('');
        setSelectedFile(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload report. Please check input values.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderTopLeftRadius: '14px',
          borderTopRightRadius: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#155eef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <FileUp size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Upload Patient Health Report
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                For {patientName} (ID: {patientId})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              padding: '10px 14px',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {success ? (
            <div style={{
              padding: '30px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle2 size={48} color="#16a34a" />
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>Health Report Saved</strong>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Report &quot;{title}&quot; has been recorded in the patient&apos;s EHR file.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Report Type *
                  </label>
                  <select
                    value={reportType}
                    onChange={(e: any) => setReportType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Lab Result">Lab Result (Blood/Urine/Path)</option>
                    <option value="Imaging">Imaging (X-Ray/CT/MRI/Ultrasound)</option>
                    <option value="Prescription">Prescription / Medication Order</option>
                    <option value="Vitals Summary">Vitals Summary Report</option>
                    <option value="Clinical Note">Nurse / Clinical Note</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Other">Other Clinical Document</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Report Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Complete Blood Count (CBC)"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Findings & Summary Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key clinical parameters, test results, interpretations, or diagnostic impressions..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Clinical / Nursing Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Specimen drawn at 14:30 by Nurse Jordan, patient tolerated well"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* File Attachment */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Attach Lab / Diagnostic File (PDF, Image, Scan)
                </label>
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0f172a' }}>
                      <FileText size={20} color="#155eef" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{selectedFile.name}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <UploadCloud size={28} color="#94a3b8" />
                      <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                        Click to select or drag & drop report file
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Supports PDF, PNG, JPG, DOCX (Max 10 MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#155eef',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <FileUp size={16} /> Save Health Report
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
