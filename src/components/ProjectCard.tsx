import React from 'react';
import { RepoItem } from '../types';
import { ExternalLink, BookOpen, Lock, Globe } from 'lucide-react';

interface CardProps {
  repo: RepoItem;
  onOpenReadme: (repo: RepoItem) => void;
  index: number;
}

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  Rust: '#dea584',
  Go: '#00ADD8',
};

export const ProjectCard: React.FC<CardProps> = ({ repo, onOpenReadme, index }) => {
  const langColor = (repo.language && LANG_COLORS[repo.language]) || '#38bdb0';

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <article
      id={`project-card-${repo.name}`}
      tabIndex={0}
      role="button"
      aria-label={`Buka detail dan README proyek ${repo.name}`}
      onClick={() => onOpenReadme(repo)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenReadme(repo);
        }
      }}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors duration-200 cursor-pointer overflow-hidden"
    >

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors tracking-tight font-mono">
              {repo.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                repo.visibility === 'public'
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {repo.visibility === 'public' ? (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </>
              )}
            </span>

            {/* Direct GitHub external icon link */}
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Buka di GitHub"
              aria-label={`Buka repositori ${repo.name} di GitHub`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 mb-4 font-normal">
          {repo.description || 'Tidak ada deskripsi singkat untuk repository ini.'}
        </p>
      </div>

      {/* Footer Info & Topics */}
      <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-3">
        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                #{topic}
              </span>
            ))}
            {repo.topics.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{repo.topics.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Language & Date & README CTA */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            {repo.language && (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: langColor }}
                />
                <span className="font-medium text-slate-300">{repo.language}</span>
              </div>
            )}
            <span>Diperbarui {formatDate(repo.updated_at)}</span>
          </div>

          <span className="flex items-center gap-1 font-semibold text-teal-400 group-hover:translate-x-0.5 transition-transform">
            <BookOpen className="w-3.5 h-3.5" />
            <span>README</span>
          </span>
        </div>
      </div>
    </article>
  );
};
