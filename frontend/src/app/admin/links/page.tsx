"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface LinkRequestData {
  id: string;
  therapist_id: string;
  therapist_name: string | null;
  therapist_email: string | null;
  client_email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  resolved_at: string | null;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: "client" | "therapist" | "admin";
}

type StatusFilter = "All" | "pending" | "approved" | "rejected";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

export default function AdminLinks() {
  const [requests, setRequests] = useState<LinkRequestData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [therapistSearch, setTherapistSearch] = useState("");
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/link-requests").then(r => {
        if (!r.ok) throw new Error("Failed to fetch link requests");
        return r.json();
      }),
      fetch("/api/admin/users").then(r => {
        if (!r.ok) throw new Error("Failed to fetch users");
        return r.json();
      })
    ])
    .then(([reqsData, usersData]) => {
      setRequests(Array.isArray(reqsData) ? reqsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    })
    .catch(err => {
      console.error(err);
      setRequests([]);
      setUsers([]);
    })
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: "" });
    }, 3000);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => statusFilter === "All" || r.status === statusFilter);
  }, [requests, statusFilter]);

  const therapists = useMemo(() => {
    return users.filter(u => u.role === "therapist");
  }, [users]);

  const filteredTherapists = useMemo(() => {
    const term = therapistSearch.toLowerCase();
    return therapists.filter(t => 
      (t.name?.toLowerCase() || "").includes(term) || (t.email.toLowerCase()).includes(term)
    );
  }, [therapists, therapistSearch]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/link-requests/${id}/approve`, { method: "PATCH" });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/link-requests/${id}/reject`, { method: "PATCH" });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLink = async () => {
    if (!selectedTherapistId || !clientEmail) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/link-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapist_id: selectedTherapistId,
          client_email: clientEmail
        })
      });
      if (res.ok) {
        const newReq = await res.json();
        setRequests(prev => [newReq, ...prev]);
        setIsModalOpen(false);
        setClientEmail("");
        setSelectedTherapistId(null);
        setTherapistSearch("");
        showToast("Link created successfully");
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.detail || "Failed to create link"}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeProps = (status: string) => {
    switch(status) {
      case "pending": return { bg: "rgba(251,176,69,0.12)", color: "#FBB045" };
      case "approved": return { bg: "rgba(110,231,183,0.12)", color: "#6EE7B7" };
      case "rejected": return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" };
      default: return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" };
    }
  };

  const selectedTherapist = therapists.find(t => t.id === selectedTherapistId);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-white/90">Link Requests</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Status Filter Pills */}
          <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/[0.05]">
            {(["All", "pending", "approved", "rejected"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  statusFilter === s 
                    ? "bg-white/[0.1] text-white" 
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#C084FC] hover:bg-[#d09dfc] text-[#1a1614] font-semibold px-5 py-2.5 rounded-xl text-[14px] transition-colors whitespace-nowrap w-full sm:w-auto"
          >
            Link Manually
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col">
        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_160px] gap-4 p-4 border-b border-white/[0.05] text-[11px] font-semibold text-white/30 tracking-wider uppercase shrink-0">
          <div>Therapist</div>
          <div>Client</div>
          <div>Requested</div>
          <div>Status</div>
          <div className="text-right pr-2">Actions</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-white/[0.04] animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-[13px]">
              No {statusFilter !== "All" ? statusFilter : ""} requests
            </div>
          ) : (
            filteredRequests.map((req) => {
              const sp = getStatusBadgeProps(req.status);
              // Check if client exists
              const clientUser = users.find(u => u.email === req.client_email && u.role === "client");

              return (
                <div key={req.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_160px] gap-4 p-4 border-b border-white/[0.02] items-center hover:bg-white/[0.01] transition-colors">
                  {/* THERAPIST */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)" }}>
                      {req.therapist_name ? req.therapist_name[0].toUpperCase() : (req.therapist_email?.[0]?.toUpperCase() || "T")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] text-white/90 font-medium truncate">{req.therapist_name || "Unknown Therapist"}</div>
                      <div className="text-[12px] text-white/40 truncate">{req.therapist_email}</div>
                    </div>
                  </div>

                  {/* CLIENT */}
                  <div className="flex flex-col min-w-0 justify-center">
                    <div className="text-[14px] text-white/90 font-medium truncate">{req.client_email}</div>
                    {clientUser && clientUser.name && (
                      <div className="text-[11px] text-white/40 truncate">{clientUser.name}</div>
                    )}
                  </div>

                  {/* REQUESTED */}
                  <div className="flex items-center text-[13px] text-white/40">
                    {formatRelativeTime(req.requested_at)}
                  </div>

                  {/* STATUS */}
                  <div className="flex items-center">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide uppercase" style={{ backgroundColor: sp.bg, color: sp.color }}>
                      {req.status}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center justify-end gap-2 pr-2">
                    {req.status === "pending" && (
                      <>
                        <button 
                          onClick={() => handleApprove(req.id)}
                          className="bg-[#C084FC]/10 text-[#C084FC] hover:bg-[#C084FC]/20 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="text-white/40 hover:text-white/80 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-white/5 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manual Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1c19] border border-white/[0.08] shadow-2xl rounded-2xl w-full max-w-[480px] p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[18px] font-medium text-white mb-6 pr-6">
              Link a Client to a Therapist
            </h2>
            
            <div className="flex flex-col gap-4 mb-8">
              {/* Therapist Dropdown */}
              <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                <label className="text-[12px] font-medium text-white/50 pl-1">Therapist</label>
                <div 
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.05] transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={`text-[14px] ${selectedTherapist ? 'text-white/90' : 'text-white/30'}`}>
                    {selectedTherapist ? (selectedTherapist.name || selectedTherapist.email) : "Select a therapist..."}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </div>
                
                {isDropdownOpen && (
                  <div className="absolute top-[100%] left-0 right-0 mt-2 bg-[#1f1c19] border border-white/[0.08] rounded-xl shadow-xl z-20 max-h-[220px] flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-white/[0.05] shrink-0 relative">
                      <Search className="w-3.5 h-3.5 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search therapists..." 
                        value={therapistSearch}
                        onChange={(e) => setTherapistSearch(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg pl-8 pr-3 py-1.5 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/10"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                      {filteredTherapists.length === 0 ? (
                        <div className="p-3 text-[13px] text-white/30 text-center">No therapists found</div>
                      ) : (
                        filteredTherapists.map(t => (
                          <div 
                            key={t.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedTherapistId === t.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                            onClick={() => { setSelectedTherapistId(t.id); setIsDropdownOpen(false); }}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="text-[14px] text-white/90 font-medium truncate">{t.name || "Unnamed Therapist"}</span>
                              <span className="text-[12px] text-white/40 truncate">{t.email}</span>
                            </div>
                            {selectedTherapistId === t.id && <Check className="w-4 h-4 text-[#C084FC] shrink-0" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Client Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-white/50 pl-1">Client Email</label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#C084FC]/50 transition-colors"
                />
              </div>
            </div>

            <button
              disabled={isSubmitting || !selectedTherapistId || !clientEmail}
              onClick={handleCreateLink}
              className="w-full bg-[#C084FC] hover:bg-[#d09dfc] disabled:opacity-50 disabled:cursor-not-allowed text-[#1a1614] font-semibold py-3 rounded-xl text-[14px] transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create Link"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div 
          className="fixed bottom-6 right-6 bg-[#1f1c19] border border-white/[0.08] rounded-[10px] px-[18px] py-[12px] text-[14px] text-white/70 shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
