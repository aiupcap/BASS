import { useState, useEffect } from 'react';
import { type GeneralSettingsConfig, generalSettingsStore, DEFAULT_GENERAL_SETTINGS } from '@bass/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@bass/ui/components/card';
import { Input } from '@bass/ui/components/input';
import { Switch } from '@bass/ui/components/switch';
import { Label } from '@bass/ui/components/label';

export const GeneralSettings = () => {
  const [settings, setSettings] = useState<GeneralSettingsConfig>(DEFAULT_GENERAL_SETTINGS);

  useEffect(() => {
    // Load initial settings
    generalSettingsStore.getSettings().then(setSettings);
  }, []);

  const updateSetting = async <K extends keyof GeneralSettingsConfig>(key: K, value: GeneralSettingsConfig[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await generalSettingsStore.updateSettings({ [key]: value });
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Max Steps per Task</Label>
                <p className="text-sm">Step limit per task</p>
              </div>
              <Input
                type="number"
                min="1"
                value={settings.maxSteps}
                onChange={e => updateSetting('maxSteps', Number.parseInt(e.target.value))}
                className="w-24"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Max Actions per Step</Label>
                <p className="text-sm">Action limit per step</p>
              </div>
              <Input
                type="number"
                min="1"
                value={settings.maxActionsPerStep}
                onChange={e => updateSetting('maxActionsPerStep', Number.parseInt(e.target.value))}
                className="w-24"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Failure Tolerance</Label>
                <p className="text-sm">How many consecutive failures in a Task before stopping</p>
              </div>
              <Input
                type="number"
                min="1"
                value={settings.maxFailures}
                onChange={e => updateSetting('maxFailures', Number.parseInt(e.target.value))}
                className="w-24"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Enable Vision</Label>
                <p className="text-sm">Use vision capabilities (Note: Vision uses more tokens)</p>
              </div>
              <Switch
                checked={settings.useVision}
                onCheckedChange={(checked: boolean) => updateSetting('useVision', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Enable Vision for Planner</Label>
                <p className="text-sm">Use vision in planner (Note: Vision uses more tokens)</p>
              </div>
              <Switch
                checked={settings.useVisionForPlanner}
                onCheckedChange={(checked: boolean) => updateSetting('useVisionForPlanner', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-lg">Replanning Frequency</Label>
                <p className="text-sm">Reconsider and update the plan every [Number] steps</p>
              </div>
              <Input
                type="number"
                min="1"
                value={settings.planningInterval}
                onChange={e => updateSetting('planningInterval', Number.parseInt(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
