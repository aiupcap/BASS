import { createRoot } from 'react-dom/client';
import SidePanel from './side-panel';
import '@extension/ui/lib/global.o.css';

function init() {
  const appContainer = document.querySelector('#side-panel-container');
  if (!appContainer) {
    throw new Error('Can not find #side-panel-container');
  }
  const root = createRoot(appContainer);
  root.render(<SidePanel />);
}

init();
