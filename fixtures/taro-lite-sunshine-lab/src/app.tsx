import Taro from '@spcsn/taro';
import type { PropsWithChildren } from 'react';
import './app.css';

function App({ children }: PropsWithChildren) {
  Taro.useLaunch(() => {
    console.log('Fixture app launched.');
  });

  return children;
}

export default App;
