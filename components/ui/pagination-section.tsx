'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationSectionProps {
  currentPage: number;
  totalPages: number;
  total: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  position?: 'top' | 'bottom';
  label?: string;
}

export function PaginationSection({
  currentPage,
  totalPages,
  total,
  hasPrevPage,
  hasNextPage,
  onPageChange,
  position = 'top',
  label = 'elementi',
}: PaginationSectionProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`px-3 sm:px-6 py-4 ${position === 'top' ? 'border-b' : 'border-t'} flex flex-col sm:flex-row items-center justify-between gap-3`}>
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        Pagina {currentPage} di {totalPages}
        <span className="hidden sm:inline"> ({total} {label})</span>
      </div>
      <div className="flex gap-2 items-center w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage}
          className="flex-shrink-0"
          title="Prima pagina"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className="flex-1 sm:flex-none"
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Precedente</span>
        </Button>

        {/* Page numbers - desktop only */}
        <div className="hidden md:flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;

            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="w-9 h-9 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="flex-1 sm:flex-none"
        >
          <span className="hidden sm:inline">Successiva</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          className="flex-shrink-0"
          title="Ultima pagina"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
