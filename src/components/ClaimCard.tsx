'use client';

import { Claim } from '@/types';
import { ExternalLink, AlertTriangle } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
}

export default function ClaimCard({ claim }: ClaimCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 5) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getEmoji = (score: number) => {
    if (score >= 8) return '🔥';
    if (score >= 5) return '🤨';
    return '🤔';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <span className="bg-slate-100 px-2 py-0.5 rounded">{claim.sourceName || claim.source}</span>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-bold ${getScoreColor(claim.ridiculousnessScore)}`}>
            {getEmoji(claim.ridiculousnessScore)} {claim.ridiculousnessScore}/10
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
          {claim.title}
        </h3>
        
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {claim.description}
        </p>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-700 italic">
              <span className="font-semibold not-italic">AI Verdict:</span> {claim.aiReasoning}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {claim.tags.map(tag => (
              <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
          <a 
            href={claim.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

