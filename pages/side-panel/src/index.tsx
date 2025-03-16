import { createRoot } from 'react-dom/client';
import SidePanel from '@/src/side-panel';
import './index.css';

function init() {
  const appContainer = document.querySelector('#side-panel');
  if (!appContainer) {
    throw new Error('Can not find #side-panel');
  }
  const root = createRoot(appContainer);
  root.render(<SidePanel />);
}

init();
