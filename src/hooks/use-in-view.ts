import { useEffect, useRef, useState } from "react";

type UseInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  initialVisible?: boolean;
};

export function useInView<T extends HTMLElement = HTMLDivElement>({
  rootMargin = "150px",
  threshold = 0,
  initialVisible = false,
}: UseInViewOptions = {}) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(initialVisible);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, isInView };
}
