import { useEffect } from 'react';
import { Button } from '@bass/ui/components/button';
import { t } from '@bass/i18n';

export default function App() {
  useEffect(() => {
    console.log('content ui loaded');
  }, []);

  return (
    <div className="flex items-center justify-between gap-2 rounded bg-blue-100 px-2 py-1">
      <div className="flex gap-1 text-blue-500">
        Edit <strong className="text-blue-700">pages/content-ui/src/app.tsx</strong> and save to reload.
      </div>
      <Button>{t('toggleTheme')}</Button>
    </div>
  );
}
