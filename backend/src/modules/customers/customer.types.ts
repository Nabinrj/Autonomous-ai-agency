export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  status: CustomerStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  organizationId: string;
  name: string;
  notes?: string;
}

export interface CustomerRepository {
  create(input: CreateCustomerInput): Promise<Customer>;
  findById(organizationId: string, id: string): Promise<Customer | null>;
  list(organizationId: string, limit: number, offset: number): Promise<Customer[]>;
}
