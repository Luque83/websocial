import { useEffect, useState, useRef, RefObject } from 'react';

interface UseIntersectionOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useIntersection<T extends HTMLElement = HTMLDivElement>({
  triggerOnce = true,
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
}: UseIntersectionOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [ref, isVisible];
}
