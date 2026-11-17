export interface BranchOption {
  id: number;
  branch_name: string;
  branch_code: string;
}

export interface UserProfile {
  id: number;
  full_name: string;
  employee_id: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  branch: BranchOption | null;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
