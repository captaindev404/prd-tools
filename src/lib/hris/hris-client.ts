/**
 * HRIS Integration Client
 *
 * Provides API client for Club Med HRIS system integration
 * Handles employee data retrieval with authentication and error handling
 */

import { z } from 'zod';

/**
 * HRIS Employee Data Schema
 */
export const HRISEmployeeSchema = z.object({
  employee_id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  display_name: z.string().optional(),
  department: z.string().optional(),
  village_id: z.string().optional(),
  role: z.enum(['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR']).optional(),
  status: z.enum(['active', 'inactive', 'departed']),
  start_date: z.string().optional(), // ISO date
  end_date: z.string().optional(), // ISO date
  transfer_date: z.string().optional(), // ISO date for village transfers
  previous_village_id: z.string().optional(),
});

export type HRISEmployee = z.infer<typeof HRISEmployeeSchema>;

/**
 * HRIS API Response Schema
 */
export const HRISResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(HRISEmployeeSchema).optional(),
  error: z.string().optional(),
  pagination: z
    .object({
      page: z.number(),
      page_size: z.number(),
      total: z.number(),
      has_more: z.boolean(),
    })
    .optional(),
});

export type HRISResponse = z.infer<typeof HRISResponseSchema>;

/**
 * HRIS Client Configuration
 */
export interface HRISClientConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
}

/**
 * HRIS API Client
 */
export class HRISClient {
  private readonly config: HRISClientConfig;
  private readonly timeout: number;

  constructor(config: HRISClientConfig) {
    this.config = config;
    this.timeout = config.timeout || 30000; // 30 seconds default
  }

  /**
   * Fetch all employees from HRIS
   */
  async fetchAllEmployees(options?: {
    page?: number;
    pageSize?: number;
    status?: 'active' | 'inactive' | 'departed';
  }): Promise<HRISEmployee[]> {
    const { page = 1, pageSize = 100, status } = options || {};

    try {
      const url = new URL('/api/v1/employees', this.config.apiUrl);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('page_size', pageSize.toString());
      if (status) {
        url.searchParams.set('status', status);
      }

      const response = await this.makeRequest(url.toString());
      const validated = HRISResponseSchema.parse(response);

      if (!validated.success) {
        throw new Error(`HRIS API error: ${validated.error || 'Unknown error'}`);
      }

      return validated.data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch employees from HRIS: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch a single employee by employee ID
   */
  async fetchEmployee(employeeId: string): Promise<HRISEmployee | null> {
    try {
      const url = new URL(`/api/v1/employees/${employeeId}`, this.config.apiUrl);
      const response = await this.makeRequest(url.toString());
      const validated = HRISResponseSchema.parse(response);

      if (!validated.success) {
        throw new Error(`HRIS API error: ${validated.error || 'Unknown error'}`);
      }

      return validated.data?.[0] || null;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch employee ${employeeId}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch employees updated since a specific date
   */
  async fetchEmployeesSince(since: Date): Promise<HRISEmployee[]> {
    try {
      const url = new URL('/api/v1/employees/updated', this.config.apiUrl);
      url.searchParams.set('since', since.toISOString());

      const response = await this.makeRequest(url.toString());
      const validated = HRISResponseSchema.parse(response);

      if (!validated.success) {
        throw new Error(`HRIS API error: ${validated.error || 'Unknown error'}`);
      }

      return validated.data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch updated employees: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Make authenticated HTTP request to HRIS API
   */
  private async makeRequest(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'X-API-Client': 'gentil-feedback',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HRIS API returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Test connection to HRIS API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = new URL('/api/v1/health', this.config.apiUrl);
      const response = await this.makeRequest(url.toString());
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create HRIS client from environment variables
 */
export function createHRISClient(): HRISClient | null {
  const apiUrl = process.env.HRIS_API_URL;
  const apiKey = process.env.HRIS_API_KEY;

  if (!apiUrl || !apiKey) {
    console.warn('HRIS integration disabled: Missing HRIS_API_URL or HRIS_API_KEY');
    return null;
  }

  return new HRISClient({
    apiUrl,
    apiKey,
  });
}

/**
 * Mock HRIS Client for development/testing
 */
export class MockHRISClient extends HRISClient {
  constructor() {
    super({
      apiUrl: 'http://mock-hris.local',
      apiKey: 'mock-key',
    });
  }

  async fetchAllEmployees(): Promise<HRISEmployee[]> {
    // Return mock data for testing
    return [
      {
        employee_id: 'CM12345',
        email: 'john.doe@clubmed.com',
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe',
        department: 'IT',
        village_id: 'vlg-001',
        role: 'USER',
        status: 'active',
        start_date: '2023-01-15',
      },
      {
        employee_id: 'CM67890',
        email: 'jane.smith@clubmed.com',
        first_name: 'Jane',
        last_name: 'Smith',
        display_name: 'Jane Smith',
        department: 'Product',
        village_id: 'vlg-002',
        role: 'PM',
        status: 'active',
        start_date: '2022-05-01',
      },
      {
        employee_id: 'CM11111',
        email: 'bob.transfer@clubmed.com',
        first_name: 'Bob',
        last_name: 'Transfer',
        display_name: 'Bob Transfer',
        department: 'Operations',
        village_id: 'vlg-003',
        previous_village_id: 'vlg-001',
        role: 'USER',
        status: 'active',
        start_date: '2021-03-10',
        transfer_date: '2024-01-01',
      },
      {
        employee_id: 'CM22222',
        email: 'alice.departed@clubmed.com',
        first_name: 'Alice',
        last_name: 'Departed',
        display_name: 'Alice Departed',
        department: 'HR',
        village_id: 'vlg-001',
        role: 'USER',
        status: 'departed',
        start_date: '2020-06-01',
        end_date: '2024-02-28',
      },
    ];
  }

  async fetchEmployee(employeeId: string): Promise<HRISEmployee | null> {
    const employees = await this.fetchAllEmployees();
    return employees.find((e) => e.employee_id === employeeId) || null;
  }

  async fetchEmployeesSince(since: Date): Promise<HRISEmployee[]> {
    // Return employees with transfer or status changes
    return [
      {
        employee_id: 'CM11111',
        email: 'bob.transfer@clubmed.com',
        first_name: 'Bob',
        last_name: 'Transfer',
        display_name: 'Bob Transfer',
        department: 'Operations',
        village_id: 'vlg-003',
        previous_village_id: 'vlg-001',
        role: 'USER',
        status: 'active',
        start_date: '2021-03-10',
        transfer_date: '2024-01-01',
      },
    ];
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}
