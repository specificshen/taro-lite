import type { PropsWithChildren } from 'react';
import { useLaunch } from '@spcsn/taro';

import './app.css';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('Taro Lite fixture app launched.');
  });

  return children;
}

export default App;
