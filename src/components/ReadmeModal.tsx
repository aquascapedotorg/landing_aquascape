import React, { useEffect, useMemo } from 'react';
import { RepoItem } from '../types';
import { X, ExternalLink, Calendar, Code, Shield } from 'lucide-react';
import { marked } from 'marked';

interface ModalProps {
  repo: RepoItem | null;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ModalProps> = ({ repo, onClose }) => {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (repo) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [repo, onClose]);

  const parsedHtml = useMemo(() => {
    if (!repo?.readme) return '';
    try {
      return marked.parse(repo.readme, {
        gfm: true,
        breaks: true,
      }) as string;
    } catch {
      return `<pre class="p-4 bg-slate-900 rounded-lg overflow-x-auto text-sm text-slate-300">${repo.readme}</pre>`;
    }
  }, [repo]);

  if (!repo) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#09121d] border border-teal-500/30 shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0c1827]/90 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-white font-mono">
              {repo.name}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                repo.visibility === 'public'
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {repo.visibility}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-teal-900/40 border border-slate-700 hover:border-teal-400/40 text-xs font-semibold text-slate-200 hover:text-white transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di GitHub</span>
            </a>

            <button
              type="button"
              id="modal-close"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Meta Strip */}
        <div className="px-6 py-3 bg-[#08101a] border-b border-slate-800/60 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-teal-400" />
              <span>Bahasa: <strong className="text-slate-200">{repo.language}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Terakhir diperbarui: {formatDate(repo.updated_at)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>Organisasi: <strong className="text-slate-200">aquascapedotorg</strong></span>
          </div>
        </div>

        {/* Modal Markdown Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-teal-800 scrollbar-track-transparent">
          {repo.readme ? (
            <div
              className="aquascape-markdown prose prose-invert max-w-none prose-teal"
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
            />
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-medium mb-1">Belum ada file README untuk repositori ini.</p>
              <p className="text-sm text-slate-500">
                Silakan buka repositori di GitHub untuk melihat kode sumber dan status commit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
