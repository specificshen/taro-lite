import { useState, useEffect } from 'react';
import Taro from '@spcsn/taro';

export function useCanGoBack(): boolean {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    try {
      const pages = Taro.getCurrentPages();
      setCanGoBack(pages.length > 1);
    } catch {
      setCanGoBack(false);
    }
  }, []);

  return canGoBack;
}
