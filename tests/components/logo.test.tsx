import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/ui/logo';

describe('Logo Component', () => {
  describe('Rendering', () => {
    it('should render without errors', () => {
      render(<Logo />);
      expect(screen.getByText('Sageloop')).toBeInTheDocument();
    });

    it('should render SVG with correct structure', () => {
      const { container } = render(<Logo />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('circle')).toBeInTheDocument();
      expect(svg?.querySelector('path')).toBeInTheDocument();
    });

    it('should have circle element (the "loop")', () => {
      const { container } = render(<Logo />);
      const circle = container.querySelector('circle');

      expect(circle).toBeInTheDocument();
      expect(circle?.getAttribute('cx')).toBe('12');
      expect(circle?.getAttribute('cy')).toBe('12');
      expect(circle?.getAttribute('r')).toBe('10');
      expect(circle?.getAttribute('stroke-width')).toBe('2');
    });

    it('should have triangle path (the "wizard/sage")', () => {
      const { container } = render(<Logo />);
      const path = container.querySelector('path');

      expect(path).toBeInTheDocument();
      expect(path?.getAttribute('d')).toBe('M12 7L8 16h8L12 7z');
      expect(path?.getAttribute('fill')).toBe('currentColor');
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      const { container } = render(<Logo size="sm" />);
      const logoIcon = container.querySelector('.rounded-lg');

      expect(logoIcon?.className).toContain('w-4');
      expect(logoIcon?.className).toContain('h-4');
    });

    it('should render medium size correctly (default)', () => {
      const { container } = render(<Logo size="md" />);
      const logoIcon = container.querySelector('.rounded-lg');

      expect(logoIcon?.className).toContain('w-6');
      expect(logoIcon?.className).toContain('h-6');
    });

    it('should render large size correctly', () => {
      const { container } = render(<Logo size="lg" />);
      const logoIcon = container.querySelector('.rounded-lg');

      expect(logoIcon?.className).toContain('w-8');
      expect(logoIcon?.className).toContain('h-8');
    });

    it('should default to medium size when no size prop is provided', () => {
      const { container } = render(<Logo />);
      const logoIcon = container.querySelector('.rounded-lg');

      expect(logoIcon?.className).toContain('w-6');
      expect(logoIcon?.className).toContain('h-6');
    });
  });

  describe('Wordmark Display', () => {
    it('should show wordmark by default', () => {
      render(<Logo />);
      expect(screen.getByText('Sageloop')).toBeInTheDocument();
    });

    it('should show wordmark when showWordmark is true', () => {
      render(<Logo showWordmark={true} />);
      expect(screen.getByText('Sageloop')).toBeInTheDocument();
    });

    it('should hide wordmark when showWordmark is false', () => {
      render(<Logo showWordmark={false} />);
      expect(screen.queryByText('Sageloop')).not.toBeInTheDocument();
    });

    it('should apply semibold font to wordmark', () => {
      render(<Logo />);
      const wordmark = screen.getByText('Sageloop');
      expect(wordmark.className).toContain('font-semibold');
    });

    it('should apply correct text size to wordmark based on logo size', () => {
      const { rerender } = render(<Logo size="sm" />);
      let wordmark = screen.getByText('Sageloop');
      expect(wordmark.className).toContain('text-sm');

      rerender(<Logo size="md" />);
      wordmark = screen.getByText('Sageloop');
      expect(wordmark.className).toContain('text-base');

      rerender(<Logo size="lg" />);
      wordmark = screen.getByText('Sageloop');
      expect(wordmark.className).toContain('text-lg');
    });
  });

  describe('Custom Props', () => {
    it('should accept and apply custom className', () => {
      const { container } = render(<Logo className="custom-class" />);
      const logoWrapper = container.firstChild as HTMLElement;

      expect(logoWrapper?.className).toContain('custom-class');
    });

    it('should forward additional props to container div', () => {
      const { container } = render(<Logo data-testid="custom-logo" />);
      expect(container.querySelector('[data-testid="custom-logo"]')).toBeInTheDocument();
    });

    it('should support ref forwarding', () => {
      const ref = { current: null };
      render(<Logo ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Styling', () => {
    it('should have dark background for logo icon', () => {
      const { container } = render(<Logo />);
      const logoIcon = container.querySelector('.rounded-lg');

      expect(logoIcon?.className).toContain('bg-gray-900');
      expect(logoIcon?.className).toContain('dark:bg-white');
    });

    it('should have white/dark-inverted colors for SVG', () => {
      const { container } = render(<Logo />);
      const svg = container.querySelector('svg');

      // SVG className is an SVGAnimatedString, access baseVal
      const svgClass = svg?.getAttribute('class') || '';
      expect(svgClass).toContain('text-white');
      expect(svgClass).toContain('dark:text-gray-900');
    });

    it('should have rounded-lg border radius', () => {
      const { container } = render(<Logo />);
      const logoIcon = container.querySelector('.rounded-lg');

      expect(logoIcon?.className).toContain('rounded-lg');
    });

    it('should have padding inside icon container', () => {
      const { container } = render(<Logo />);
      const logoIcon = container.querySelector('.rounded-lg');

      expect(logoIcon?.className).toContain('p-1.5');
    });

    it('should use flex layout with items-center', () => {
      const { container } = render(<Logo />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper?.className).toContain('flex');
      expect(wrapper?.className).toContain('items-center');
    });

    it('should have appropriate gap between icon and wordmark', () => {
      const { container } = render(<Logo size="sm" />);
      let wrapper = container.firstChild as HTMLElement;
      expect(wrapper?.className).toContain('gap-1.5');

      const { container: container2 } = render(<Logo size="md" />);
      wrapper = container2.firstChild as HTMLElement;
      expect(wrapper?.className).toContain('gap-2');

      const { container: container3 } = render(<Logo size="lg" />);
      wrapper = container3.firstChild as HTMLElement;
      expect(wrapper?.className).toContain('gap-2');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden on SVG', () => {
      const { container } = render(<Logo />);
      const svg = container.querySelector('svg');

      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have viewBox for SVG scalability', () => {
      const { container } = render(<Logo />);
      const svg = container.querySelector('svg');

      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  describe('Design System Compliance', () => {
    it('should match design system circle specifications', () => {
      const { container } = render(<Logo />);
      const circle = container.querySelector('circle');

      // Design system: circle with stroke, no fill
      expect(circle?.getAttribute('fill')).toBe('none');
      expect(circle?.getAttribute('stroke')).toBe('currentColor');
    });

    it('should match design system triangle specifications', () => {
      const { container } = render(<Logo />);
      const path = container.querySelector('path');

      // Design system: triangle with fill, no stroke
      expect(path?.getAttribute('fill')).toBe('currentColor');
      expect(path?.getAttribute('stroke')).toBe('none');
    });

    it('should always pair icon with wordmark by default', () => {
      // Design system principle: "Always paired with 'Sageloop' wordmark"
      render(<Logo />);
      expect(screen.getByText('Sageloop')).toBeInTheDocument();
    });
  });

  describe('Component API', () => {
    it('should have correct displayName', () => {
      expect(Logo.displayName).toBe('Logo');
    });

    it('should support all documented size options', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

      sizes.forEach(size => {
        const { container } = render(<Logo size={size} />);
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle showWordmark=false with custom className', () => {
      const { container } = render(
        <Logo showWordmark={false} className="custom" />
      );

      expect((container.firstChild as HTMLElement)?.className).toContain('custom');
      expect(screen.queryByText('Sageloop')).not.toBeInTheDocument();
    });

    it('should render consistently with multiple instances', () => {
      const { container } = render(
        <>
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
        </>
      );

      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(3);

      svgs.forEach(svg => {
        expect(svg.querySelector('circle')).toBeInTheDocument();
        expect(svg.querySelector('path')).toBeInTheDocument();
      });
    });
  });
});
