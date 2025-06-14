
import { useEffect, useRef, MutableRefObject } from 'react';

interface UseClickOutsideProps {
  onClickOutside: () => void;
  enabled?: boolean;
}

export const useClickOutside = <T extends HTMLElement = HTMLElement>({
  onClickOutside,
  enabled = true
}: UseClickOutsideProps): MutableRefObject<T | null> => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClickOutside, enabled]);

  return ref;
};
