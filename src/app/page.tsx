'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Claim, FetchLog } from '@/types';
import ClaimCard from '@/components/ClaimCard';
import AuthButton from '@/components/AuthButton';
import { Clock, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import Image from 'next/image';

type ScoreFilter = 'all' | 'high' | 'medium' | 'low';

export default function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ success: boolean; message: string } | null>(null);

  const fetchClaims = async () => {
    try {
      if (!db) {
        // Provide mock data for UI testing if Firebase is not configured
        const mockData: Claim[] = [
          {
            id: '1',
            title: "Elon Musk claims Cybertruck can serve as a boat for short distances",
            description: "In a recent tweet, Musk suggested that the Cybertruck is waterproof enough to cross rivers, lakes & even seas that aren't too choppy.",
            url: "https://x.com/elonmusk",
            source: 'x',
            sourceName: 'X (Twitter)',
            bullshitScore: 8,
            aiReasoning: "While impressive, treating a consumer truck as a boat has significant safety and regulatory hurdles.",
            tags: ['cybertruck', 'elon'],
            publishedAt: new Date(),
            fetchedAt: new Date(),
          },
          {
            id: '2',
            title: "Tesla to launch 'Model Pi' smartphone with Starlink connectivity",
            description: "Rumors circulate about a revolutionary Tesla phone that can work on Mars and features solar charging.",
            url: "https://reddit.com",
            source: 'reddit',
            sourceName: 'r/TeslaMotors',
            bullshitScore: 9,
            aiReasoning: "This is a recurring internet myth with no official confirmation from Tesla or SpaceX.",
            tags: ['tech', 'rumor'],
            publishedAt: new Date(),
            fetchedAt: new Date(),
          }
        ];
        setClaims(mockData);
        setLoading(false);
        return;
      }

      // Build query with score filter
      let q = query(
        collection(db, 'claims'),
        orderBy('bullshitScore', 'desc')
      );

      // Apply score filter
      if (scoreFilter === 'high') {
        q = query(q, where('bullshitScore', '>=', 8));
      } else if (scoreFilter === 'medium') {
        q = query(q, where('bullshitScore', '>=', 5), where('bullshitScore', '<', 8));
      } else if (scoreFilter === 'low') {
        q = query(q, where('bullshitScore', '<', 5));
      }

      q = query(q, limit(20));

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Handle Firestore timestamps
        publishedAt: doc.data().publishedAt?.toDate(),
        fetchedAt: doc.data().fetchedAt?.toDate(),
      })) as Claim[];
      setClaims(data);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLastUpdated = async () => {
    if (!db) return;
    
    try {
      const logsQuery = query(
        collection(db, 'fetchLogs'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(logsQuery);
      
      if (!snapshot.empty) {
        const log = snapshot.docs[0].data() as FetchLog;
        const timestamp = log.timestamp?.toDate();
        if (timestamp) {
          const now = new Date();
          const diffMs = now.getTime() - timestamp.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          if (diffHours > 0) {
            setLastUpdated(`${diffHours}h ago`);
          } else if (diffMins > 0) {
            setLastUpdated(`${diffMins}m ago`);
          } else {
            setLastUpdated('Just now');
          }
        }
      }
    } catch (error) {
      console.error("Error fetching last updated:", error);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchLastUpdated();
  }, [scoreFilter]);

  const handleManualFetch = async () => {
    setFetching(true);
    setFetchStatus(null);
    
    try {
      const response = await fetch('/api/fetch-now', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFetchStatus({
          success: true,
          message: `Success! Fetched ${data.fetched} items, processed ${data.processed} new claims.`
        });
        
        // Refresh the claims list after a short delay
        setTimeout(() => {
          fetchClaims();
          fetchLastUpdated();
        }, 2000);
        
        // Clear success message after 5 seconds
        setTimeout(() => setFetchStatus(null), 5000);
      } else {
        const errorMsg = data.details 
          ? `Error: ${data.error || 'Fatal error'}. ${data.details}` 
          : data.error || data.message || 'Failed to fetch news';
        setFetchStatus({
          success: false,
          message: errorMsg
        });
        // Don't auto-dismiss errors - let user see them
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to fetch news. Check console for details.';
      setFetchStatus({
        success: false,
        message: `Network Error: ${errorMsg}`
      });
      // Don't auto-dismiss errors
    } finally {
      setFetching(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            {/* Logo - Top Left */}
            <div className="flex-shrink-0">
              <img
                src="/TBS-Logo.png"
                alt="TBS Logo"
                className="object-contain h-16 w-16 rounded-full"
                style={{ maxWidth: '200px' }}
              />
            </div>
            <AuthButton />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Mr Tesla <span className="text-blue-600">Bullshit</span> Detector
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Aggregating and scoring the internet's most outrageous, exaggerated, and false claims about Tesla and Elon Musk.
            </p>
          </div>
        </div>
      </header>

      {/* Feed Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800">
              Latest Bullshit
            </h2>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Updated {lastUpdated}</span>
              </div>
            )}
            
            {/* Manual Fetch Button */}
            <button
              onClick={handleManualFetch}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
              {fetching ? 'Fetching...' : 'Fetch News Now'}
            </button>
          </div>

          {/* Score Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setScoreFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scoreFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setScoreFilter('high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scoreFilter === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🔥 High (8-10)
            </button>
            <button
              onClick={() => setScoreFilter('medium')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scoreFilter === 'medium'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🤨 Medium (5-7)
            </button>
            <button
              onClick={() => setScoreFilter('low')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scoreFilter === 'low'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🤔 Low (1-4)
            </button>
          </div>
        </div>

        {/* Fetch Status Message */}
        {fetchStatus && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 relative ${
            fetchStatus.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {fetchStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${fetchStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                {fetchStatus.message}
              </p>
            </div>
            <button
              onClick={() => setFetchStatus(null)}
              className={`flex-shrink-0 ${fetchStatus.success ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'} transition-colors`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : claims.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {claims.map(claim => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500">No ridiculousness detected yet. Check back in a bit!</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            Powered by Gemini AI. For entertainment purposes only. 
          </p>
        </div>
      </footer>
    </main>
  );
}
