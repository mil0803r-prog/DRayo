import { Product, Sale, DailySaleRecord, MetaAdExpense, WhatsAppTemplate, AISettings, DatabaseStatus, DatabaseBackup, PricingCalculationRecord, IndirectCost } from '../types';

export interface FullDatabasePayload {
  products: Product[];
  sales: Sale[];
  dailyRecords: DailySaleRecord[];
  metaExpenses: MetaAdExpense[];
  indirectCosts?: IndirectCost[];
  templates: WhatsAppTemplate[];
  pricingRecords?: PricingCalculationRecord[];
  aiSettings: AISettings;
}

export const api = {
  // Check Database Connection & Stats
  async getDbStatus(): Promise<DatabaseStatus | null> {
    try {
      const res = await fetch('/api/db/status');
      if (!res.ok) throw new Error('Status request failed');
      const data = await res.json();
      return data.stats;
    } catch (err) {
      console.warn('Could not fetch DB status:', err);
      return null;
    }
  },

  // Fetch full data from server DB
  async fetchFullDatabase(): Promise<FullDatabasePayload | null> {
    try {
      const res = await fetch('/api/db/all');
      if (!res.ok) throw new Error('Fetch DB all failed');
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Could not fetch full DB from server:', err);
      return null;
    }
  },

  // Sync entire state to server DB
  async syncDatabase(payload: FullDatabasePayload): Promise<boolean> {
    try {
      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn('Sync to server DB failed:', err);
      return false;
    }
  },

  // Save/Update single Product
  async saveProduct(product: Product): Promise<boolean> {
    try {
      const res = await fetch('/api/db/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete product
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Save/Update Daily Record
  async saveDailyRecord(record: DailySaleRecord): Promise<boolean> {
    try {
      const res = await fetch('/api/db/daily-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete Daily Record
  async deleteDailyRecord(recordId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/daily-records/${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Bulk Delete Daily Records
  async deleteBulkDailyRecords(ids: string[]): Promise<boolean> {
    try {
      const res = await fetch('/api/db/daily-records/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Save/Update Sale
  async saveSale(sale: Sale): Promise<boolean> {
    try {
      const res = await fetch('/api/db/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Update Sale Fields
  async updateSale(saleId: string, updatedFields: Partial<Sale>): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/sales/${encodeURIComponent(saleId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete Sale
  async deleteSale(saleId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/sales/${encodeURIComponent(saleId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Save Meta Expense
  async saveMetaExpense(expense: MetaAdExpense): Promise<boolean> {
    try {
      const res = await fetch('/api/db/meta-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete Meta Expense
  async deleteMetaExpense(expenseId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/meta-expenses/${encodeURIComponent(expenseId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Bulk Delete Meta Expenses
  async deleteBulkMetaExpenses(ids: string[]): Promise<boolean> {
    try {
      const res = await fetch('/api/db/meta-expenses/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Save Pricing Record
  async savePricingRecord(record: PricingCalculationRecord): Promise<boolean> {
    try {
      const res = await fetch('/api/db/pricing-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete Pricing Record
  async deletePricingRecord(recordId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/pricing-records/${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Bulk Delete Pricing Records
  async bulkDeletePricingRecords(ids: string[]): Promise<boolean> {
    try {
      const res = await fetch('/api/db/pricing-records/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Create Snapshot Backup
  async createBackup(label?: string): Promise<DatabaseBackup | null> {
    try {
      const res = await fetch('/api/db/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error('Create backup failed');
      const data = await res.json();
      return data.backup;
    } catch (err) {
      console.error('Failed to create backup:', err);
      return null;
    }
  },

  // Get Backups list
  async getBackups(): Promise<DatabaseBackup[]> {
    try {
      const res = await fetch('/api/db/backups');
      if (!res.ok) return [];
      const data = await res.json();
      return data.backups || [];
    } catch {
      return [];
    }
  },

  // Restore Snapshot Backup
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/db/restore/${encodeURIComponent(backupId)}`, {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Reset DB
  async resetDatabase(): Promise<boolean> {
    try {
      const res = await fetch('/api/db/reset', {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Import Database JSON Dump
  async importDatabase(dump: any): Promise<boolean> {
    try {
      const res = await fetch('/api/db/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dump),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
