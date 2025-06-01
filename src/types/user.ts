// types/user.ts
import { ProjectMember } from './project';

export type UserRole = 'admin' | 'project_manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
  projectMembers?: ProjectMember[];
  status?: 'active' | 'invited' | 'inactive';
}
