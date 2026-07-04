"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import { withRole } from "@/components/withRole";

interface Quote {
  id: string;
  content: string;
  tags: string[];
  author?: string;
  order?: number;
}

interface QuotePack {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  quote_count: number;
}

function QuotePackDetailPage({ params }: { params: Promise<{ packId: string }> }) {
  const router = useRouter();
  const { packId } = use(params);

  const [pack, setPack] = useState<QuotePack | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [packRes, quotesRes] = await Promise.all([
        fetch(`/api/therapist/packs/${packId}`),
        fetch(`/api/therapist/packs/${packId}/quotes`)
      ]);
      if (!packRes.ok || !quotesRes.ok) throw new Error();
      
      setPack(await packRes.json());
      setQuotes(await quotesRes.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [packId]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!newTags.includes(tagInput.trim())) {
        setNewTags([...newTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setNewTags(newTags.filter((tag) => tag !== t));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/therapist/packs/${packId}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          author: newAuthor || null,
          tags: newTags,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setNewContent("");
        setNewAuthor("");
        setNewTags([]);
        setTagInput("");
        fetchData();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (quoteId: string) => {
    if (!confirm("Remove this quote from the pack?")) return;
    try {
      const res = await fetch(`/api/therapist/packs/${packId}/quotes/${quoteId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 md:p-8 max-w-[1200px] mx-auto w-full gap-6 animate-pulse">
        <div className="h-[100px] bg-white/[0.04] rounded-[14px]" />
        <div className="flex flex-col gap-4">
          <div className="h-[80px] bg-white/[0.04] rounded-[14px]" />
          <div className="h-[80px] bg-white/[0.04] rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-8 text-[var(--foreground)] text-center">
        <div className="text-[16px] text-[var(--muted)] mb-4">Quote Pack not found</div>
        <button onClick={() => router.push("/therapist/packs")} className="text-[#C084FC] hover:underline">
          Return to Quote Packs
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full p-4 md:p-8 max-w-[1200px] mx-auto w-full gap-6 pb-24 font-sans text-[var(--foreground)]">
      <button 
        onClick={() => router.push("/therapist/packs")}
        className="flex items-center gap-2 text-[13px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Packs
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-[14px] p-6 gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--foreground)] mb-1">{pack.name}</h1>
          {pack.description && (
            <p className="text-[13px] text-[var(--muted)] max-w-2xl">{pack.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pack.tags.map((t) => (
              <span key={t} className="bg-[var(--surface-2)] border border-[var(--card-border)] text-[var(--muted)] text-[11px] px-[10px] py-[3px] rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg px-4 py-2.5 text-[13px] hover:bg-[#C084FC]/25 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Quote
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-[14px]">
          <div className="text-[15px] font-medium text-[var(--foreground)] mb-2">This pack is empty</div>
          <div className="text-[13px] text-[var(--muted)] mb-6">Add quotes to share them with your clients.</div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-[#C084FC] text-[13px] hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add your first quote
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((q) => (
            <div key={q.id} className="bg-[var(--surface-2)] hover:bg-[var(--surface-2)] border border-white/[0.05] rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between transition-colors group">
              <div className="flex-1">
                <div className="text-[15px] text-[var(--foreground)] leading-relaxed mb-2 font-serif italic">"{q.content}"</div>
                {q.author && <div className="text-[13px] text-[var(--muted)] mb-3">— {q.author}</div>}
                
                <div className="flex flex-wrap gap-1.5">
                  {q.tags.map((t) => (
                    <span key={t} className="bg-[var(--surface-2)] border border-[var(--card-border)] text-[var(--muted)] text-[11px] px-[10px] py-[3px] rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => handleDelete(q.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-[#F97060] p-2 h-fit shrink-0 rounded-md hover:bg-[var(--surface-2)]"
                title="Remove quote"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Quote Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1f1c19] border border-[var(--card-border)] rounded-[16px] p-8 max-w-[480px] w-full shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-full hover:bg-[var(--surface-2)]"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[18px] font-semibold text-[var(--foreground)] mb-6">Add Quote to Pack</h2>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1.5">Quote Content</label>
                <textarea
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="The text of the quote..."
                  className="w-full bg-[var(--surface-2)] border border-[var(--card-border)] focus:border-[var(--card-border)] rounded-lg px-4 py-3 text-[13px] text-[var(--foreground)] outline-none transition-colors h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1.5">Author (Optional)</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. Carl Jung"
                  className="w-full bg-[var(--surface-2)] border border-[var(--card-border)] focus:border-[var(--card-border)] rounded-lg px-4 py-3 text-[13px] text-[var(--foreground)] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1.5">Tags (Press Enter to add)</label>
                <div className="bg-[var(--surface-2)] border border-[var(--card-border)] focus-within:border-[var(--card-border)] rounded-lg p-2 flex flex-wrap gap-2 transition-colors min-h-[48px] items-center">
                  {newTags.map((t) => (
                    <span
                      key={t}
                      className="bg-[var(--surface-2)] border border-[var(--card-border)] text-[var(--muted)] text-[11px] px-[10px] py-[4px] rounded-full flex items-center gap-1.5"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-[var(--foreground)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={newTags.length === 0 ? "Add tags..." : ""}
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--foreground)] min-w-[100px] px-2 py-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!newContent.trim() || creating}
                className="mt-4 w-full bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg py-3 text-[14px] font-medium hover:bg-[#C084FC]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Adding..." : "Add Quote"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRole(QuotePackDetailPage, "therapist");
