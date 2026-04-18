"use client";

import { RefreshCw, Shield, ShieldAlert, ShieldCheck, User2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  image: string | null;
  createdAt: string;
};

type Props = {
  currentUserRole: UserRole;
  currentUserId: string;
};

const ROLE_CONFIG: Record<UserRole, { label: string; icon: typeof User2; color: string; bg: string }> = {
  USER: { label: "User", icon: User2, color: "text-gray-600", bg: "bg-gray-100" },
  ADMIN: { label: "Admin", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-100" },
  SUPERADMIN: { label: "Super Admin", icon: ShieldAlert, color: "text-violet-600", bg: "bg-violet-100" },
};

function getAssignableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === "SUPERADMIN") return ["USER", "ADMIN", "SUPERADMIN"];
  if (actorRole === "ADMIN") return ["USER"];
  return [];
}

export function UserManagement({ currentUserRole, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const payload = (await response.json()) as { data: UserRecord[] };

      setUsers(payload.data);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingId(userId);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to update role");
        return;
      }

      setSuccessMsg(payload.message ?? "Role updated");
      await fetchUsers();

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Network error");
    } finally {
      setUpdatingId(null);
    }
  }

  const assignable = getAssignableRoles(currentUserRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-violet-600" />
        <span className="ml-2 text-sm text-gray-500">Loading users…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Status messages */}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}
      {successMsg ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          {successMsg}
        </div>
      ) : null}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {(["USER", "ADMIN", "SUPERADMIN"] as UserRole[]).map((role) => {
          const config = ROLE_CONFIG[role];
          const count = users.filter((u) => u.role === role).length;
          const Icon = config.icon;

          return (
            <div key={role} className={`rounded-2xl ${config.bg} p-4`}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className={`text-xs font-medium ${config.color}`}>{config.label}s</span>
              </div>
              <p className={`mt-1 text-2xl font-bold ${config.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Refresh */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {users.length} user{users.length !== 1 ? "s" : ""} total
        </p>
        <Button variant="ghost" size="sm" onClick={fetchUsers}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* User list */}
      <div className="space-y-3">
        {users.map((user) => {
          const config = ROLE_CONFIG[user.role];
          const Icon = config.icon;
          const isCurrentUser = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              {/* User info */}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name ?? "Unnamed"}
                    </p>
                    {isCurrentUser ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                        You
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* Role controls */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                  <Shield className="h-3 w-3" />
                  {config.label}
                </span>

                {!isCurrentUser && assignable.length > 0 ? (
                  <select
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={updatingId === user.id}
                  >
                    <option value={user.role}>{ROLE_CONFIG[user.role].label}</option>
                    {assignable
                      .filter((r) => r !== user.role)
                      .map((r) => (
                        <option key={r} value={r}>
                          → {ROLE_CONFIG[r].label}
                        </option>
                      ))}
                  </select>
                ) : null}

                {updatingId === user.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-violet-600" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
