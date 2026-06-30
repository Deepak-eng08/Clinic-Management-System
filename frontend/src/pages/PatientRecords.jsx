import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { FolderOpen, FileText, Upload, Plus, Trash2, Sparkles, X, Brain, CheckCircle2 } from 'lucide-react';

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload state
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('Lab Report');
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // AI Summary state
  const [summaryModal, setSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    try {
      const response = await API.get('/patients/records');
      setRecords(response.data.records);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch medical folder records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadSuccess(false);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    setUploadLoading(true);
    setUploadSuccess(false);

    try {
      // 1. Upload file to static/cloudinary endpoint
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = uploadRes.data.fileUrl;

      // 2. Register medical record in Mongoose database
      await API.post('/patients/records', {
        title,
        type: recordType,
        fileUrl
      });

      setTitle('');
      setFile(null);
      // Reset input element
      document.getElementById('file-upload-input').value = '';

      setUploadSuccess(true);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.error || 'File upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSummarizeReport = async (record) => {
    setSelectedRecord(record);
    setSummaryData(null);
    setSummaryLoading(true);
    setSummaryModal(true);

    try {
      const response = await API.post('/ai/summarize-report', { recordId: record._id });
      setSummaryData(response.data.summary);
    } catch (err) {
      setSummaryData({
        executiveSummary: 'AI extraction service failed to compile this document. Please check API credentials.',
        keyMetrics: [],
        recommendations: [],
        warnings: ['Failed to query OpenAI completion model.']
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const getRecordIcon = (type) => {
    switch (type) {
      case 'Lab Report': return '🔬';
      case 'Prescription': return '📄';
      case 'Scan / X-Ray': return '🩻';
      default: return '📁';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Medical Folders</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload external diagnostics, lab results, scans, and get instant explanations via AI.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Hand: Upload Widget Form */}
        <form onSubmit={handleUploadSubmit} className="lg:col-span-4 glass-card p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <Upload className="h-4.5 w-4.5 text-brand-500" />
            Upload Document
          </h3>

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 rounded-xl border border-teal-200/10 text-[10px] font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Record added successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Document Title</label>
            <input
              type="text"
              placeholder="e.g. Blood Test Report June"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Folder Category</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="Lab Report">Lab Report</option>
              <option value="Prescription">Prescription Document</option>
              <option value="Scan / X-Ray">Scan / X-Ray</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Choose File (.pdf, .jpg, .png)</label>
            <input
              id="file-upload-input"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              required
            />
          </div>

          <button
            type="submit"
            disabled={uploadLoading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white text-xs font-semibold rounded-xl transition flex justify-center items-center gap-2"
          >
            {uploadLoading ? 'Uploading File...' : 'Upload to Folder'}
          </button>
        </form>

        {/* Right Hand: Record List Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {records.map((rec) => (
              <div key={rec._id} className="glass-card p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-44">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">{getRecordIcon(rec.type)}</span>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase">
                      {rec.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-3 truncate">{rec.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Uploaded: {new Date(rec.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-850 pt-3.5">
                  <a
                    href={rec.fileUrl.startsWith('http') ? rec.fileUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${rec.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[10px] font-bold rounded-lg text-center transition"
                  >
                    View File
                  </a>
                  {rec.type === 'Lab Report' && (
                    <button
                      onClick={() => handleSummarizeReport(rec)}
                      className="flex-1 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-md shadow-brand-500/10"
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Summarize
                    </button>
                  )}
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                No medical documents uploaded to this folder yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Record Summary Modal */}
      {summaryModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-brand-500" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">AI Medical Report Explanation</h3>
                  <p className="text-[9px] text-slate-400">File: {selectedRecord.title}</p>
                </div>
              </div>
              <button onClick={() => setSummaryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {summaryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                  <p className="text-slate-400">AI is digesting report metrics and generating simple explanations...</p>
                </div>
              ) : summaryData ? (
                <div className="space-y-4">
                  {/* Executive Summary */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl space-y-2 border border-slate-100/50">
                    <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Executive Summary</h4>
                    <p className="text-slate-650 dark:text-slate-400 leading-relaxed">{summaryData.executiveSummary}</p>
                  </div>

                  {/* Key Metrics */}
                  {summaryData.keyMetrics && summaryData.keyMetrics.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[10px]">Identified Metrics</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {summaryData.keyMetrics.map((met) => (
                          <div key={met.name} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-450">{met.name}</span>
                            <div className="flex justify-between items-baseline mt-1">
                              <span className="font-bold text-slate-800 dark:text-white">{met.value}</span>
                              <span className={`text-[9px] font-bold uppercase ${met.status === 'High' || met.status === 'Low' ? 'text-red-500' : 'text-teal-600'
                                }`}>
                                {met.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings & Alerts */}
                  {summaryData.warnings && summaryData.warnings.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200/10 space-y-2">
                      <h4 className="font-bold text-red-650 dark:text-red-400 uppercase tracking-wider text-[10px]">Critical Warnings</h4>
                      <ul className="list-disc pl-4 text-red-600 dark:text-red-400 space-y-1">
                        {summaryData.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {summaryData.recommendations && summaryData.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-850 dark:text-white uppercase tracking-wider text-[10px]">Next Steps</h4>
                      <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 space-y-1">
                        {summaryData.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-slate-400 italic">No summary available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
