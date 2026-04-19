/**
 * Tenant Types
 * Types used for tenant management and related components
 */

export interface TenantTableRow {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface TenantListProps {
  onAddTenant?: () => void;
  onRefreshed?: () => void;
  onTenantDeleted?: () => void;
  staticData?: TenantTableRow[];
}

export interface PlatformMe {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
}

export interface CreateTenantForm {
  tenantName: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  departmentName: string;
}
