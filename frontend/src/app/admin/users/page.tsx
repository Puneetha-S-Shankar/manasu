"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, Shield, Ban, CheckCircle, X } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: "client" | "therapist" | "admin";
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

type RoleFilter = "All" | "client" | "therapist" | "admin";

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");

  // Modals
  const [roleModalUser, setRoleModalUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState<"client" | "therapist" | "admin">("client");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [statusModalUser, setStatusModalUser] = useState<UserData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async res => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error(err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter === "All" || u.role === roleFilter;
      const term = search.toLowerCase();
      const matchSearch = (u.name?.toLowerCase() || "").includes(term) || (u.email.toLowerCase()).includes(term);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${roleModalUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === roleModalUser.id ? { ...u, role: newRole } : u));
        setRoleModalUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusModalUser) return;
    setIsUpdatingStatus(true);
    const action = statusModalUser.is_active ? "deactivate" : "reactivate";
    try {
      const res = await fetch(`/api/admin/users/${statusModalUser.id}/${action}`, {
        method: "PATCH"
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === statusModalUser.id ? { ...u, is_active: !statusModalUser.is_active } : u));
        setStatusModalUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getRoleBadgeProps = (role: string) => {
    switch(role) {
      case "admin": return { bg: "rgba(110,231,183,0.12)", color: "#6EE7B7" };
      case "therapist": return { bg: "rgba(192,132,252,0.12)", color: "#C084FC" };
      default: return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" };
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-semibold text-white/90">Users</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Role Filter Pills */}
          <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/[0.05]">
            {(["All", "client", "therapist", "admin"] as RoleFilter[]).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  roleFilter === r 
                    ? "bg-white/[0.1] text-white" 
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#C084FC]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] gap-4 p-4 border-b border-white/[0.05] text-[11px] font-semibold text-white/30 tracking-wider uppercase shrink-0">
          <div>User</div>
          <div>Role</div>
          <div>Status</div>
          <div>Joined</div>
          <div className="text-right pr-2">Actions</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-white/30 text-[13px]">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-[13px]">No users found</div>
          ) : (
            filteredUsers.map((user) => {
              const rp = getRoleBadgeProps(user.role);
              const joinDate = new Date(user.created_at).toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric"
              });

              return (
                <div key={user.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] gap-4 p-4 border-b border-white/[0.02] items-center hover:bg-white/[0.01] transition-colors">
                  {/* USER */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)" }}>
                      {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] text-white/90 font-medium truncate">{user.name || "Unnamed"}</div>
                      <div className="text-[12px] text-white/40 truncate">{user.email}</div>
                    </div>
                  </div>

                  {/* ROLE */}
                  <div className="flex items-center">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide uppercase" style={{ backgroundColor: rp.bg, color: rp.color }}>
                      {user.role}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div className="flex items-center">
                    <span className={`text-[13px] font-medium ${user.is_active ? 'text-[#6EE7B7]' : 'text-white/25'}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* JOINED */}
                  <div className="flex items-center text-[13px] text-white/40">
                    {joinDate}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center justify-end gap-1 pr-2">
                    <button 
                      onClick={() => { setRoleModalUser(user); setNewRole(user.role); }}
                      className="p-1.5 text-white/30 hover:text-white/80 hover:bg-white/5 rounded-md transition-colors"
                      title="Change Role"
                    >
                      <Shield className="w-[18px] h-[18px]" />
                    </button>
                    <button 
                      onClick={() => setStatusModalUser(user)}
                      className={`p-1.5 hover:bg-white/5 rounded-md transition-colors ${user.is_active ? 'text-white/30 hover:text-[#F97060]' : 'text-white/30 hover:text-[#6EE7B7]'}`}
                      title={user.is_active ? "Deactivate" : "Reactivate"}
                    >
                      {user.is_active ? <Ban className="w-[18px] h-[18px]" /> : <CheckCircle className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1c19] border border-white/[0.08] shadow-2xl rounded-2xl w-full max-w-[380px] p-6 relative">
            <button onClick={() => setRoleModalUser(null)} className="absolute top-4 right-4 text-white/30 hover:text-white/80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[18px] font-medium text-white mb-6 pr-6">
              Change Role for <span className="text-white/50">{roleModalUser.name || roleModalUser.email}</span>
            </h2>
            
            <div className="flex flex-col gap-2 mb-8">
              {(["client", "therapist", "admin"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setNewRole(r)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    newRole === r 
                      ? "bg-white/[0.08] border-white/[0.15] text-white" 
                      : "bg-transparent border-white/[0.05] text-white/50 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${newRole === r ? 'border-[#C084FC]' : 'border-white/20'}`}>
                    {newRole === r && <div className="w-2 h-2 rounded-full bg-[#C084FC]" />}
                  </div>
                  <span className="capitalize text-[14px] font-medium">{r}</span>
                </button>
              ))}
            </div>

            <button
              disabled={isUpdatingRole || newRole === roleModalUser.role}
              onClick={handleUpdateRole}
              className="w-full bg-[#C084FC] hover:bg-[#d09dfc] disabled:opacity-50 disabled:cursor-not-allowed text-[#1a1614] font-semibold py-2.5 rounded-xl text-[14px] transition-colors"
            >
              {isUpdatingRole ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1c19] border border-white/[0.08] shadow-2xl rounded-2xl w-full max-w-[380px] p-6 text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${statusModalUser.is_active ? 'bg-[#F97060]/10 text-[#F97060]' : 'bg-[#6EE7B7]/10 text-[#6EE7B7]'}`}>
              {statusModalUser.is_active ? <Ban className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            </div>
            
            <h2 className="text-[18px] font-medium text-white mb-2">
              {statusModalUser.is_active ? "Deactivate User" : "Reactivate User"}
            </h2>
            
            <p className="text-[14px] text-white/50 mb-8">
              {statusModalUser.is_active 
                ? `This will prevent ${statusModalUser.name || statusModalUser.email} from logging in. Continue?`
                : `${statusModalUser.name || statusModalUser.email} will be able to log in again. Continue?`
              }
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStatusModalUser(null)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 py-2.5 rounded-xl font-medium text-[14px] transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isUpdatingStatus}
                onClick={handleUpdateStatus}
                className={`flex-1 font-medium py-2.5 rounded-xl text-[14px] transition-colors disabled:opacity-50 text-[#1a1614] ${
                  statusModalUser.is_active 
                    ? "bg-[#F97060] hover:bg-[#ff8678]" 
                    : "bg-[#6EE7B7] hover:bg-[#86f0c6]"
                }`}
              >
                {isUpdatingStatus ? "Updating..." : (statusModalUser.is_active ? "Deactivate" : "Reactivate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
