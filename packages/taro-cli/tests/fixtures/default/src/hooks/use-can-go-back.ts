import Taro from '@spcsn/taro';
import { useEffect, useState } from 'react';

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
