import { useState } from 'react';
import { Button } from '@bass/ui/components/button';
import { ThemeProvider } from '@bass/ui/components/theme-provider';
import { withErrorBoundary, withSuspense } from '@bass/shared';
import { GeneralSettings } from './components/general-settings';
import { ModelSettings } from './components/model-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@bass/ui/components/card';
import { Settings, ChartColumn } from 'lucide-react';
import { cn } from '@bass/ui/lib/utils';

const Options = () => {
  const [activeTab, setActiveTab] = useState('general');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'models':
        return <ModelSettings />;
      default:
        return null;
    }
  };

  const navigationItems = [
    { id: 'general', icon: Settings, label: 'General' },
    { id: 'models', icon: ChartColumn, label: 'Models' },
  ];

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen min-w-[768px] flex">
        <Card className="w-48 h-screen rounded-none border-r">
          <CardHeader>
            <CardTitle className="text-xl">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav>
              {navigationItems.map(({ id, icon: Icon, label }) => (
                <Button
                  key={id}
                  variant={activeTab === id ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start gap-2 mb-1')}
                  onClick={() => setActiveTab(id)}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <main className="flex-1 p-8">
          <Card className="min-w-[512px] max-w-[1024px] mx-auto">
            <CardContent className="pt-6">{renderTabContent()}</CardContent>
          </Card>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default withErrorBoundary(withSuspense(Options, <div>Loading...</div>), <div>Error Occurred</div>);
