import { InvalidPageException } from '../exception/invalid-page.exception';

export class Page {
  readonly currentPage: number;
  readonly size: number;
  readonly totalPages?: number;
  readonly totalItems?: number;

  private constructor(
    currentPage: number,
    size: number,
    totalItems?: number,
  ) {
    this.currentPage = currentPage;
    this.size = size;
    if (totalItems !== undefined) {
      this.totalItems = totalItems;
      this.totalPages = Math.ceil(totalItems / size);
    }
    this.validateOrThrow();
  }

  static create(currentPage: number, size: number): Page {
    return new Page(currentPage, size);
  }

  private validateOrThrow(): void {
    if (!Number.isInteger(this.currentPage) || this.currentPage < 1) {
      throw new InvalidPageException(
        'currentPage',
        this.currentPage,
        'must be an integer >= 1',
      );
    }
    if (
      !Number.isInteger(this.size) ||
      this.size < 1 ||
      this.size > 100
    ) {
      throw new InvalidPageException(
        'size',
        this.size,
        'must be an integer between 1 and 100',
      );
    }
  }

  withTotals(totalItems: number): Page {
    return new Page(this.currentPage, this.size, totalItems);
  }

  toSkip(): number {
    return (this.currentPage - 1) * this.size;
  }

  toTake(): number {
    return this.size;
  }
}
