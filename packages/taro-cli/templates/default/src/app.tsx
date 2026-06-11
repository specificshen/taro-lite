import type { PropsWithChildren } from 'react';
import { useLaunch } from '@spcsn/taro';

import './app.{{ cssExt }}';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('Taro Lite app launched.');
  });

  return children;
}

export default App;
