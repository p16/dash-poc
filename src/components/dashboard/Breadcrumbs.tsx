import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-2 h-4 w-4 text-neutral-600" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'font-semibold text-neutral-900'
                    : 'text-neutral-600'
                }
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
