'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // If pathname changed, we're on a new page, so hide loading
    if (prevPathnameRef.current !== pathname) {
      setIsLoading(false);
      prevPathnameRef.current = pathname;
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Listen for link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        try {
          const url = new URL(link.href);
          const currentUrl = new URL(window.location.href);
          
          // Only show loading if navigating to a different page (same origin)
          if (
            url.origin === currentUrl.origin &&
            url.pathname !== currentUrl.pathname &&
            !link.hasAttribute('target') && // Don't show for external links or new tabs
            !link.hasAttribute('download') && // Don't show for download links
            !link.getAttribute('href')?.startsWith('#') // Don't show for anchor links
          ) {
            // Show loading immediately for better UX
            setIsLoading(true);
            
            // Auto-hide after 5 seconds as fallback (in case navigation fails)
            loadingTimeoutRef.current = setTimeout(() => {
              setIsLoading(false);
            }, 5000);
          }
        } catch (error) {
          // Invalid URL, ignore
        }
      }
    };

    // Listen for form submissions that navigate
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const action = form.action;
      
      if (action) {
        try {
          const url = new URL(action, window.location.origin);
          const currentUrl = new URL(window.location.href);
          
          if (url.pathname !== currentUrl.pathname) {
            setIsLoading(true);
            loadingTimeoutRef.current = setTimeout(() => {
              setIsLoading(false);
            }, 5000);
          }
        } catch (error) {
          // Invalid URL, ignore
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

