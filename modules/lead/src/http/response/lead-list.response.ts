import { Page } from '@modules/shared';
import { LeadResponse } from './lead.response';

export class LeadListResponse {
  data: LeadResponse[];
  currentPage: number;
  size: number;
  totalPages?: number;
  totalItems?: number;

  constructor(data: LeadResponse[], page: Page) {
    this.data = data;
    this.currentPage = page.currentPage;
    this.size = page.size;
    this.totalPages = page.totalPages;
    this.totalItems = page.totalItems;
  }
}
