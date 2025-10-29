import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn() - Class name utility', () => {
  describe('Basic functionality', () => {
    it('should combine multiple class strings', () => {
      const result = cn('px-2', 'py-1');
      expect(result).toBe('px-2 py-1');
    });

    it('should handle empty strings', () => {
      const result = cn('px-2', '', 'py-1');
      expect(result).toBe('px-2 py-1');
    });

    it('should handle undefined values', () => {
      const result = cn('px-2', undefined, 'py-1');
      expect(result).toBe('px-2 py-1');
    });

    it('should handle null values', () => {
      const result = cn('px-2', null, 'py-1');
      expect(result).toBe('px-2 py-1');
    });

    it('should handle false values', () => {
      const result = cn('px-2', false, 'py-1');
      expect(result).toBe('px-2 py-1');
    });
  });

  describe('Tailwind class merging', () => {
    it('should merge conflicting padding classes with rightmost priority', () => {
      const result = cn('px-2', 'px-4');
      expect(result).toContain('px-4');
      expect(result).not.toContain('px-2');
    });

    it('should merge conflicting margin classes', () => {
      const result = cn('m-2', 'm-4');
      expect(result).toContain('m-4');
      expect(result).not.toContain('m-2');
    });

    it('should merge conflicting background color classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('bg-red-500');
    });

    it('should merge conflicting text color classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toContain('text-blue-500');
      expect(result).not.toContain('text-red-500');
    });

    it('should merge conflicting display classes', () => {
      const result = cn('block', 'flex');
      expect(result).toContain('flex');
      expect(result).not.toContain('block');
    });

    it('should merge conflicting width classes', () => {
      const result = cn('w-1/2', 'w-full');
      expect(result).toContain('w-full');
      expect(result).not.toContain('w-1/2');
    });

    it('should merge conflicting height classes', () => {
      const result = cn('h-screen', 'h-10');
      expect(result).toContain('h-10');
      expect(result).not.toContain('h-screen');
    });
  });

  describe('Non-conflicting class combination', () => {
    it('should preserve non-conflicting classes', () => {
      const result = cn('px-2', 'py-1', 'bg-white');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('bg-white');
    });

    it('should combine layout and sizing classes', () => {
      const result = cn('flex', 'items-center', 'justify-between', 'w-full', 'h-10');
      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-between');
      expect(result).toContain('w-full');
      expect(result).toContain('h-10');
    });

    it('should combine rounded and shadow classes', () => {
      const result = cn('rounded-lg', 'shadow-md', 'border');
      expect(result).toContain('rounded-lg');
      expect(result).toContain('shadow-md');
      expect(result).toContain('border');
    });
  });

  describe('Array and object inputs', () => {
    it('should handle array of classes', () => {
      const result = cn(['px-2', 'py-1']);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle nested arrays', () => {
      const result = cn(['px-2', ['py-1', 'bg-white']]);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('bg-white');
    });

    it('should handle conditional object syntax', () => {
      const result = cn({
        'px-2': true,
        'py-1': true,
        'bg-white': false,
      });
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).not.toContain('bg-white');
    });
  });

  describe('Complex real-world scenarios', () => {
    it('should handle Button component base + variant + override', () => {
      const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2';
      const variant = 'bg-primary text-primary-foreground';
      const overrides = 'w-full';

      const result = cn(baseClasses, variant, overrides);
      expect(result).toContain('inline-flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-center');
      expect(result).toContain('rounded-md');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-primary');
      expect(result).toContain('text-primary-foreground');
      expect(result).toContain('w-full');
    });

    it('should handle Input component styling with disabled state', () => {
      const baseClasses = 'w-full px-3 py-2 rounded-md border bg-white';
      const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-primary';
      const disabledClasses = true ? 'opacity-50 cursor-not-allowed' : '';

      const result = cn(baseClasses, focusClasses, disabledClasses);
      expect(result).toContain('w-full');
      expect(result).toContain('px-3');
      expect(result).toContain('rounded-md');
      expect(result).toContain('focus:outline-none');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('opacity-50');
      expect(result).toContain('cursor-not-allowed');
    });

    it('should handle Card component with custom className override', () => {
      const cardClasses = 'bg-card text-card-foreground rounded-xl border py-6 shadow-sm';
      const customClasses = 'max-w-2xl';

      const result = cn(cardClasses, customClasses);
      expect(result).toContain('bg-card');
      expect(result).toContain('rounded-xl');
      expect(result).toContain('max-w-2xl');
    });

    it('should handle responsive classes', () => {
      const result = cn('w-full', 'md:w-1/2', 'lg:w-1/3');
      expect(result).toContain('w-full');
      expect(result).toContain('md:w-1/2');
      expect(result).toContain('lg:w-1/3');
    });

    it('should handle dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-slate-950', 'text-black', 'dark:text-white');
      expect(result).toContain('bg-white');
      expect(result).toContain('dark:bg-slate-950');
      expect(result).toContain('text-black');
      expect(result).toContain('dark:text-white');
    });

    it('should handle complex form field scenario', () => {
      const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm';
      const focusClasses = 'focus:border-blue-500 focus:ring-blue-500';
      const errorClasses = true ? 'border-red-500' : 'border-gray-300';
      const disabledClasses = false ? 'bg-gray-100 cursor-not-allowed' : '';

      const result = cn(baseClasses, focusClasses, errorClasses, disabledClasses);
      expect(result).toContain('block');
      expect(result).toContain('w-full');
      expect(result).toContain('rounded-md');
      expect(result).toContain('focus:border-blue-500');
      expect(result).toContain('border-red-500');
      expect(result).not.toContain('bg-gray-100');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long class strings', () => {
      const longClasses = 'flex items-center justify-between px-4 py-2 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200';
      const result = cn(longClasses);
      expect(result).toContain('flex');
      expect(result).toContain('transition-shadow');
      expect(result).toContain('duration-200');
    });

    it('should handle classes with special characters', () => {
      const result = cn('before:content-[\'""\']', 'after:content-[\'""\']');
      expect(result).toContain('before:content-');
      expect(result).toContain('after:content-');
    });

    it('should handle arbitrary Tailwind values', () => {
      const result = cn('[&_svg]:size-4', '[&_svg]:shrink-0');
      expect(result).toContain('[&_svg]:size-4');
      expect(result).toContain('[&_svg]:shrink-0');
    });

    it('should handle multiple conflicting classes in sequence', () => {
      const result = cn('p-2', 'p-4', 'p-6', 'p-8');
      expect(result).toContain('p-8');
      expect(result).not.toContain('p-2');
      expect(result).not.toContain('p-4');
      expect(result).not.toContain('p-6');
    });

    it('should not add extra spaces', () => {
      const result = cn('px-2', 'py-1');
      const doubleSpace = result.includes('  ');
      expect(doubleSpace).toBe(false);
    });

    it('should return trimmed result', () => {
      const result = cn('px-2', 'py-1');
      expect(result.startsWith(' ')).toBe(false);
      expect(result.endsWith(' ')).toBe(false);
    });
  });

  describe('Consistency and determinism', () => {
    it('should produce consistent output for same input', () => {
      const result1 = cn('px-2', 'py-1', 'bg-white');
      const result2 = cn('px-2', 'py-1', 'bg-white');
      expect(result1).toBe(result2);
    });

    it('should always prioritize rightmost conflicting class', () => {
      const result1 = cn('px-2', 'px-4');
      const result2 = cn('px-2', 'px-4');
      expect(result1).toBe(result2);
      expect(result1).toContain('px-4');
    });
  });
});
