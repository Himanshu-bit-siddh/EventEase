import type { JwtUser } from "./auth";

export type Permission = 
  | "event:create"
  | "event:read"
  | "event:update"
  | "event:delete"
  | "event:manage_members"
  | "registration:read"
  | "registration:export"
  | "checkin:manage"
  | "interaction:create"
  | "interaction:moderate"
  | "interaction:delete"
  | "user:manage"
  | "system:admin";

export type Role = "ADMIN" | "STAFF" | "OWNER";

// Permission matrix: role -> permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "event:create", "event:read", "event:update", "event:delete", "event:manage_members",
    "registration:read", "registration:export", "checkin:manage",
    "interaction:create", "interaction:moderate", "interaction:delete",
    "user:manage", "system:admin"
  ],
  STAFF: [
    "event:read", "event:update", "event:manage_members",
    "registration:read", "registration:export", "checkin:manage",
    "interaction:create", "interaction:moderate", "interaction:delete"
  ],
  OWNER: [
    "event:create", "event:read", "event:update", "event:delete", "event:manage_members",
    "registration:read", "registration:export", "checkin:manage",
    "interaction:create", "interaction:moderate", "interaction:delete"
  ]
};

// Check if a user has a specific permission
export function hasPermission(user: JwtUser | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role];
  return userPermissions.includes(permission);
}

// Check if a user has any of the specified permissions
export function hasAnyPermission(user: JwtUser | null, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

// Check if a user has all of the specified permissions
export function hasAllPermissions(user: JwtUser | null, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

// Check if a user can manage a specific event
export function canManageEvent(user: JwtUser | null, eventOwnerId: string): boolean {
  if (!user) return false;
  
  if (user.role === "ADMIN") return true;
  if (user.role === "OWNER" && String(user.id) === eventOwnerId) return true;
  
  return false;
}

// Check if a user can view a specific event
export function canViewEvent(user: JwtUser | null, eventOwnerId: string, isPublic: boolean): boolean {
  if (isPublic) return true;
  if (!user) return false;
  
  if (user.role === "ADMIN") return true;
  if (user.role === "OWNER" && String(user.id) === eventOwnerId) return true;
  if (user.role === "STAFF") return true; // Staff can view events they're assigned to
  
  return false;
}

// Check if a user can edit a specific event
export function canEditEvent(user: JwtUser | null, eventOwnerId: string): boolean {
  if (!user) return false;
  
  if (user.role === "ADMIN") return true;
  if (user.role === "OWNER" && String(user.id) === eventOwnerId) return true;
  if (user.role === "STAFF") return true; // Staff can edit events they're assigned to
  
  return false;
}

// Check if a user can delete a specific event
export function canDeleteEvent(user: JwtUser | null, eventOwnerId: string): boolean {
  if (!user) return false;
  
  if (user.role === "ADMIN") return true;
  if (user.role === "OWNER" && String(user.id) === eventOwnerId) return true;
  
  return false;
}

// Check if a user can manage registrations for a specific event
export function canManageRegistrations(user: JwtUser | null, eventOwnerId: string): boolean {
  if (!user) return false;
  
  if (user.role === "ADMIN") return true;
  if (user.role === "OWNER" && String(user.id) === eventOwnerId) return true;
  if (user.role === "STAFF") return true; // Staff can manage registrations
  
  return false;
}

// Check if a user can moderate interactions
export function canModerateInteractions(user: JwtUser | null): boolean {
  if (!user) return false;
  
  return user.role === "ADMIN" || user.role === "STAFF";
}

// Check if a user can manage users
export function canManageUsers(user: JwtUser | null): boolean {
  if (!user) return false;
  
  return user.role === "ADMIN";
}

// Check if a user can access system admin features
export function canAccessSystemAdmin(user: JwtUser | null): boolean {
  if (!user) return false;
  
  return user.role === "ADMIN";
}

// Get all permissions for a specific role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

// Get all roles that have a specific permission
export function getRolesWithPermission(permission: Permission): Role[] {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, permissions]) => permissions.includes(permission))
    .map(([role]) => role as Role);
}


