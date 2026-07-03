"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, Flag, Trash2, X, AlertTriangle } from "lucide-react";

interface QuoteData {
  id: string;
  content: string;
  pack_name: string | null;
  tags: string[];
  therapist_name: string | null;
  flagged: boolean;
}

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [deleteModalQuote, setDeleteModalQuote] = useState<QuoteData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuotes = async (pageNumber: number, isFlaggedOnly: boolean, append = false) => {
    try {
      const query = new URLSearchParams();
      query.set("page", pageNumber.toString());
      query.set("page_size", "20");
      if (isFlaggedOnly) {
        query.set("flagged", "true");
      }
      
      const res = await fetch(`/api/admin/quotes?${query.toString()}`);
      if (res.ok) {
        const data: QuoteData[] = await res.json();
        if (data.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        if (append) {
          setQuotes(prev => [...prev, ...data]);
        } else {
          setQuotes(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchQuotes(1, flaggedOnly, false).finally(() => setLoading(false));
  }, [flaggedOnly]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuotes(nextPage, flaggedOnly, true).finally(() => setLoadingMore(false));
  };

  const handleToggleFlag = async (quote: QuoteData) => {
    // Optimistic UI update
    setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, flagged: !q.flagged } : q));
    
    try {
      await fetch(`/api/admin/quotes/${quote.id}/flag`, { method: "PATCH" });
    } catch (err) {
      console.error(err);
      // Revert if error
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, flagged: quote.flagged } : q));
    }
  };

  const handleDelete = async () => {
    if (!deleteModalQuote) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/quotes/${deleteModalQuote.id}`, { method: "DELETE" });
      if (res.ok) {
        setQuotes(prev => prev.filter(q => q.id !== deleteModalQuote.id));
        setDeleteModalQuote(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredQuotes = useMemo(() => {
    if (!search.trim()) return quotes;
    const term = search.toLowerCase();
    return quotes.filter(q => q.content.toLowerCase().includes(term));
  }, [quotes, search]);

  return (
    <div className="p-6 md:p-8 max-w-[800px] mx-auto flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-white/90">Quotes</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors flex items-center gap-2 ${
              flaggedOnly 
                ? "bg-[rgba(251,176,69,0.12)] text-[#FBB045]" 
                : "bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/80"
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${flaggedOnly ? 'fill-[#FBB045]' : ''}`} />
            Flagged only
          </button>

          <div className="relative w-full sm:w-[260px]">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#C084FC]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="flex-1 overflow-y-auto pb-8">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-[120px] bg-white/[0.04] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-[13px]">
            No quotes found
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredQuotes.map(quote => (
              <div key={quote.id} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5 flex flex-col">
                {/* Quote Text */}
                <div className="text-[14px] text-white/75 italic mb-[10px] leading-relaxed font-serif">
                  "{quote.content}"
                </div>
                
                {/* Tags Row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {quote.pack_name && (
                    <span className="bg-[#C084FC]/10 text-[#C084FC] text-[11px] font-medium px-2 py-0.5 rounded-md">
                      {quote.pack_name}
                    </span>
                  )}
                  {quote.tags && quote.tags.length > 0 && quote.tags.map(tag => (
                    <span key={tag} className="bg-white/[0.05] text-white/60 text-[11px] px-2 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-[11px] text-white/30">
                    Added by {quote.therapist_name || "Unknown"}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleToggleFlag(quote)}
                      className={`p-1.5 rounded-lg transition-colors hover:bg-white/5 ${quote.flagged ? 'text-[#FBB045]' : 'text-white/25'}`}
                      title={quote.flagged ? "Unflag quote" : "Flag quote"}
                    >
                      <Flag className={`w-4 h-4 ${quote.flagged ? 'fill-[#FBB045]' : ''}`} />
                    </button>
                    <button 
                      onClick={() => setDeleteModalQuote(quote)}
                      className="p-1.5 rounded-lg transition-colors text-[#F97060]/60 hover:text-[#F97060] hover:bg-white/5"
                      title="Delete quote"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && !search && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full mt-4 py-3 border border-white/[0.08] text-white/50 hover:bg-white/[0.03] hover:text-white/80 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalQuote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1c19] border border-white/[0.08] shadow-2xl rounded-2xl w-full max-w-[380px] p-6 text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-[#F97060]/10 text-[#F97060]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h2 className="text-[18px] font-medium text-white mb-2">
              Delete Quote
            </h2>
            
            <p className="text-[14px] text-white/50 mb-8 px-2">
              Delete this quote permanently? This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalQuote(null)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 py-2.5 rounded-xl font-medium text-[14px] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 font-medium py-2.5 rounded-xl text-[14px] transition-colors disabled:opacity-50 text-[#1a1614] bg-[#F97060] hover:bg-[#ff8678]"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
