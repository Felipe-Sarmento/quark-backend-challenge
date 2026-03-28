import { Page } from '../page';
import { InvalidPageException } from '../../exception/invalid-page.exception';

describe('Page', () => {
  describe('create — valid', () => {
    it('should create page with minimum valid values', () => {
      const page = Page.create(1, 1);
      expect(page.currentPage).toBe(1);
      expect(page.size).toBe(1);
    });

    it('should create page with maximum size', () => {
      const page = Page.create(1, 100);
      expect(page.currentPage).toBe(1);
      expect(page.size).toBe(100);
    });

    it('should create page with typical values', () => {
      const page = Page.create(2, 10);
      expect(page.currentPage).toBe(2);
      expect(page.size).toBe(10);
    });

    it('should compute toSkip correctly for page 1', () => {
      const page = Page.create(1, 10);
      expect(page.toSkip()).toBe(0);
    });

    it('should compute toSkip correctly for page 3', () => {
      const page = Page.create(3, 10);
      expect(page.toSkip()).toBe(20);
    });

    it('should compute toTake correctly', () => {
      const page = Page.create(2, 25);
      expect(page.toTake()).toBe(25);
    });
  });

  describe('withTotals', () => {
    it('should compute totalPages correctly (25 items, size 10 = 3 pages)', () => {
      const page = Page.create(1, 10);
      const enriched = page.withTotals(25);
      expect(enriched.totalPages).toBe(3);
      expect(enriched.totalItems).toBe(25);
    });

    it('should compute totalPages for exact multiple (20 items, size 10 = 2 pages)', () => {
      const page = Page.create(1, 10);
      const enriched = page.withTotals(20);
      expect(enriched.totalPages).toBe(2);
      expect(enriched.totalItems).toBe(20);
    });

    it('should set totalItems correctly', () => {
      const page = Page.create(2, 5);
      const enriched = page.withTotals(42);
      expect(enriched.totalItems).toBe(42);
    });

    it('should return a new instance (immutable)', () => {
      const page = Page.create(1, 10);
      const enriched = page.withTotals(30);
      expect(page).not.toBe(enriched);
      expect(page.totalItems).toBeUndefined();
      expect(enriched.totalItems).toBe(30);
    });

    it('should preserve currentPage and size', () => {
      const page = Page.create(3, 15);
      const enriched = page.withTotals(100);
      expect(enriched.currentPage).toBe(3);
      expect(enriched.size).toBe(15);
    });
  });

  describe('create — invalid', () => {
    it('should throw for currentPage = 0', () => {
      expect(() => Page.create(0, 10)).toThrow(InvalidPageException);
    });

    it('should throw for currentPage = -1', () => {
      expect(() => Page.create(-1, 10)).toThrow(InvalidPageException);
    });

    it('should throw for size = 0', () => {
      expect(() => Page.create(1, 0)).toThrow(InvalidPageException);
    });

    it('should throw for size = 101', () => {
      expect(() => Page.create(1, 101)).toThrow(InvalidPageException);
    });

    it('should throw for non-integer currentPage', () => {
      expect(() => Page.create(1.5, 10)).toThrow(InvalidPageException);
    });

    it('should throw for non-integer size', () => {
      expect(() => Page.create(1, 10.5)).toThrow(InvalidPageException);
    });

    it('should throw with appropriate error message for invalid currentPage', () => {
      expect(() => Page.create(0, 10)).toThrow(
        /currentPage=0.*must be an integer >= 1/,
      );
    });

    it('should throw with appropriate error message for invalid size', () => {
      expect(() => Page.create(1, 101)).toThrow(
        /size=101.*must be an integer between 1 and 100/,
      );
    });
  });
});
