import React, { useEffect, useState } from 'react';
import API from '../services/api.js';
import { ShieldAlert, ArrowLeft, ArrowRight, Eye } from 'lucide-react';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/admin/logs?page=${page}&limit=15`);
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch audit activity logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Security & Activity Audit</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Chronological record of system changes, access events, and transactions.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-200/10 text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action Event</th>
                <th className="px-6 py-4">Triggered By</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Detailed Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-3.5 text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      hour12: false,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                      log.action.includes('FAIL') ? 'bg-red-50 text-red-600 dark:bg-red-950/20' :
                      log.action.includes('ONBOARD') || log.action.includes('CREATE') ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/20' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {log.userId ? (
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.userId.name}</span>
                        <span className="text-[9px] text-slate-400 ml-1.5 font-bold uppercase">({log.userId.role})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unauthenticated</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs">
                    No activity logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginated Controller Footer */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} logs)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-700 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-700 disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
