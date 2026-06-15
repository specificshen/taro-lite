import { useLaunch } from '@spcsn/taro';
import type { PropsWithChildren } from 'react';
import './app.css';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('Taro Lite fixture app launched.');
  });

  return children;
}

export default App;
