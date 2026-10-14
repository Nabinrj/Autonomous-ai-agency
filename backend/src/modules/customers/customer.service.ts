import { notFound } from '../../common/errors/app-error.js';
import type { PoolClient } from 'pg';
import type { CreateCustomerInput, CustomerRepository } from './customer.types.js';

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  create(input: CreateCustomerInput, transaction?: PoolClient) {
    return this.repository.create(input, transaction);
  }

  async get(organizationId: string, id: string) {
    const customer = await this.repository.findById(organizationId, id);
    if (!customer) throw notFound('Customer');
    return customer;
  }

  list(organizationId: string, limit: number, offset: number) {
    return this.repository.list(organizationId, limit, offset);
  }
}
