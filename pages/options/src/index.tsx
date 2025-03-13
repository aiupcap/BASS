import { createRoot } from 'react-dom/client';
import '@extension/ui/lib/global.o.css';
import Options from './options';

function init() {
  const appContainer = document.querySelector('#options-container');
  if (!appContainer) {
    throw new Error('Can not find #options-container');
  }
  const root = createRoot(appContainer);
  root.render(<Options />);
}

init();
