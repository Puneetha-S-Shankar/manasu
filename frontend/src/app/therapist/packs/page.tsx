"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Tag } from "lucide-react";
import { withRole } from "@/components/withRole";

interface QuotePack {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  quote_count: number;
}

function QuotePacksPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<QuotePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/therapist/packs");
      if (!res.ok) throw new Error();
      setPacks(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacks();
  }, []);

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
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/therapist/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc || null,
          tags: newTags,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setNewName("");
        setNewDesc("");
        setNewTags([]);
        setTagInput("");
        fetchPacks();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full p-4 md:p-8 max-w-[1200px] mx-auto w-full gap-6 pb-24 font-sans">
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-[14px] p-6">
        <h1 className="text-[20px] font-semibold text-white/90">Quote Packs</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg px-4 py-2.5 text-[13px] hover:bg-[#C084FC]/25 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Pack
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] bg-white/[0.04] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-[13px] text-white/40">Failed to load packs.</div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] border border-white/[0.05] rounded-[14px]">
          <div className="text-[15px] font-medium text-white/70 mb-2">No packs yet</div>
          <div className="text-[13px] text-white/40 mb-6">Create your first quote pack</div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-[#C084FC] text-[13px] hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Create Pack
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <div
              key={pack.id}
              onClick={() => router.push(`/therapist/packs/${pack.id}`)}
              className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] rounded-2xl p-5 flex flex-col justify-between h-[140px] cursor-pointer transition-all group"
            >
              <div>
                <div className="text-[15px] text-white/[0.82] font-semibold mb-2 truncate">
                  {pack.name}
                </div>
                <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-[22px]">
                  {pack.tags.length === 0 && (
                    <span className="text-[11px] text-white/20 italic">No tags</span>
                  )}
                  {pack.tags.map((t) => (
                    <span
                      key={t}
                      className="bg-white/[0.06] border border-white/[0.08] text-white/40 text-[11px] px-[10px] py-[3px] rounded-full whitespace-nowrap"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
                <div className="text-[11px] text-white/30">{pack.quote_count} quotes</div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-white/30 group-hover:text-white/50 transition-colors">Edit</span>
                  <span className="text-[12px] text-[#C084FC] font-medium">Push to client ›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Pack Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1f1c19] border border-white/[0.08] rounded-[16px] p-8 max-w-[480px] w-full shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/30 hover:text-white/70 transition-colors rounded-full hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[18px] font-semibold text-white/90 mb-6">Create Quote Pack</h2>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] text-white/50 mb-1.5">Pack Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Grounding Techniques"
                  className="w-full bg-white/[0.03] border border-white/[0.1] focus:border-white/[0.25] rounded-lg px-4 py-3 text-[13px] text-white/90 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[12px] text-white/50 mb-1.5">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this pack for?"
                  className="w-full bg-white/[0.03] border border-white/[0.1] focus:border-white/[0.25] rounded-lg px-4 py-3 text-[13px] text-white/90 outline-none transition-colors h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-white/50 mb-1.5">Tags (Press Enter to add)</label>
                <div className="bg-white/[0.03] border border-white/[0.1] focus-within:border-white/[0.25] rounded-lg p-2 flex flex-wrap gap-2 transition-colors min-h-[48px] items-center">
                  {newTags.map((t) => (
                    <span
                      key={t}
                      className="bg-white/[0.08] border border-white/[0.1] text-white/60 text-[11px] px-[10px] py-[4px] rounded-full flex items-center gap-1.5"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-white/90"
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
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-white/90 min-w-[100px] px-2 py-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!newName.trim() || creating}
                className="mt-4 w-full bg-[#C084FC]/15 border border-[#C084FC]/30 text-[#C084FC] rounded-lg py-3 text-[14px] font-medium hover:bg-[#C084FC]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create Pack"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRole(QuotePacksPage, "therapist");
