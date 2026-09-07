import type { Pool } from 'pg';
import type { CreateCustomerInput, Customer, CustomerRepository } from './customer.types.js';

interface CustomerRow {
  id: string;
  organization_id: string;
  name: string;
  status: Customer['status'];
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export class PostgresCustomerRepository implements CustomerRepository {
  constructor(private readonly db: Pool) {}

  async create(input: CreateCustomerInput): Promise<Customer> {
    const result = await this.db.query<CustomerRow>(
      `INSERT INTO customers (organization_id, name, notes)
       VALUES ($1, $2, $3)
       RETURNING id, organization_id, name, status, notes, created_at, updated_at`,
      [input.organizationId, input.name, input.notes ?? null],
    );
    return mapCustomer(result.rows[0]!);
  }

  async findById(organizationId: string, id: string): Promise<Customer | null> {
    const result = await this.db.query<CustomerRow>(
      `SELECT id, organization_id, name, status, notes, created_at, updated_at
       FROM customers WHERE organization_id = $1 AND id = $2`,
      [organizationId, id],
    );
    return result.rows[0] ? mapCustomer(result.rows[0]) : null;
  }

  async list(organizationId: string, limit: number, offset: number): Promise<Customer[]> {
    const result = await this.db.query<CustomerRow>(
      `SELECT id, organization_id, name, status, notes, created_at, updated_at
       FROM customers WHERE organization_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset],
    );
    return result.rows.map(mapCustomer);
  }
}
