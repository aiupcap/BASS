import { createRoot } from 'react-dom/client';
import './index.css';
import Options from './options';

function init() {
  const optionsContainer = document.querySelector('#options');
  if (!optionsContainer) {
    throw new Error('Can not find #options');
  }
  const root = createRoot(optionsContainer);
  optionsContainer.className = 'min-w-[768px]';
  root.render(<Options />);
}

init();
