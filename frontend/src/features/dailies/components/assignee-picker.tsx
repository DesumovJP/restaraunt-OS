"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { getAssignableRoles, canAssignToOthers } from "@/lib/task-permissions";
import { TaskUser, DEPARTMENT_LABELS, Department } from "@/types/daily-tasks";
import { SYSTEM_ROLE_LABELS } from "@/types/auth";
import { SystemRole } from "@/lib/rbac";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Users } from "lucide-react";

interface AssigneePickerProps {
  value?: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export function AssigneePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Оберіть виконавця",
  className,
}: AssigneePickerProps) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Get roles that current user can assign to
  const assignableRoles = useMemo(() => {
    if (!user) return [];
    return getAssignableRoles(user.systemRole);
  }, [user]);

  // Check if user can assign to others
  const canAssignOthers = useMemo(() => {
    if (!user) return false;
    return canAssignToOthers(user.systemRole);
  }, [user]);

  // Fetch users
  useEffect(() => {
    if (!token || assignableRoles.length === 0) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const rolesFilter = assignableRoles
          .map((r) => `filters[systemRole][$in]=${r}`)
          .join("&");

        const response = await fetch(
          `${STRAPI_URL}/api/users?${rolesFilter}&filters[isActive][$eq]=true&populate=*`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token, assignableRoles]);

  // Group users by department
  const groupedUsers = useMemo(() => {
    const groups: Record<Department, TaskUser[]> = {
      management: [],
      kitchen: [],
      service: [],
      bar: [],
      none: [],
    };

    users.forEach((u) => {
      const dept = (u.department as Department) || "none";
      if (groups[dept]) {
        groups[dept].push(u);
      }
    });

    return groups;
  }, [users]);

  // If can only assign to self, show simple display
  if (!canAssignOthers) {
    return (
      <div className={cn("flex items-center gap-2 p-2 border rounded-md bg-muted", className)}>
        <Avatar className="h-6 w-6">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="text-sm">{user?.username}</span>
        <Badge variant="secondary" className="text-xs">
          Собі
        </Badge>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Завантаження..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Self - always first */}
        {user && (
          <>
            <SelectItem value={user.documentId}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {user.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>Собі</span>
              </div>
            </SelectItem>
            <SelectSeparator />
          </>
        )}

        {/* Others by department */}
        {Object.entries(groupedUsers).map(([dept, deptUsers]) => {
          const filteredUsers = deptUsers.filter((u) => u.documentId !== user?.documentId);
          if (filteredUsers.length === 0) return null;

          return (
            <SelectGroup key={dept}>
              <SelectLabel className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                {DEPARTMENT_LABELS[dept as Department]?.uk || dept}
              </SelectLabel>
              {filteredUsers.map((u) => (
                <SelectItem key={u.documentId} value={u.documentId}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {u.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{u.firstName || u.username}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {SYSTEM_ROLE_LABELS[u.systemRole as SystemRole]?.uk || u.systemRole}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}

        {users.length === 0 && !loading && (
          <div className="p-2 text-sm text-muted-foreground text-center">
            Немає доступних користувачів
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
