import type { Pool } from 'pg';
import type { CreateLeadInput, Lead, LeadRepository, LeadStatus } from './lead.types.js';

interface LeadRow {
  id: string;
  organization_id: string;
  customer_id: string | null;
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  score: string | number | null;
  qualification_reason: string | null;
}

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    source: row.source,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    score: row.score === null ? null : Number(row.score),
    qualificationReason: row.qualification_reason,
  };
}

export class PostgresLeadRepository implements LeadRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateLeadInput): Promise<Lead> {
    const result = await this.pool.query<LeadRow>(
      `INSERT INTO leads (organization_id, source, name, email, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, customer_id, source, name, email, phone,
                 status, score, qualification_reason`,
      [input.organizationId, input.source, input.name ?? null, input.email ?? null, input.phone ?? null],
    );
    return mapLead(result.rows[0]!);
  }

  async findById(organizationId: string, id: string): Promise<Lead | null> {
    const result = await this.pool.query<LeadRow>(
      `SELECT id, organization_id, customer_id, source, name, email, phone,
              status, score, qualification_reason
       FROM leads
       WHERE organization_id = $1 AND id = $2`,
      [organizationId, id],
    );
    return result.rows[0] ? mapLead(result.rows[0]) : null;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: LeadStatus,
    score?: number,
    reason?: string,
  ): Promise<Lead> {
    const result = await this.pool.query<LeadRow>(
      `UPDATE leads
       SET status = $3,
           score = COALESCE($4, score),
           qualification_reason = COALESCE($5, qualification_reason),
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING id, organization_id, customer_id, source, name, email, phone,
                 status, score, qualification_reason`,
      [organizationId, id, status, score ?? null, reason ?? null],
    );
    return mapLead(result.rows[0]!);
  }

  async convert(organizationId: string, id: string, customerId: string): Promise<Lead> {
    const result = await this.pool.query<LeadRow>(
      `UPDATE leads
       SET status = 'CONVERTED', customer_id = $3, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING id, organization_id, customer_id, source, name, email, phone,
                 status, score, qualification_reason`,
      [organizationId, id, customerId],
    );
    return mapLead(result.rows[0]!);
  }
}
