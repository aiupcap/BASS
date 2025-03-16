import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@bass/ui/components/card';
import { Input } from '@bass/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bass/ui/components/select';
import { Separator } from '@bass/ui/components/separator';
import { Button } from '@bass/ui/components/button';
import {
  llmProviderStore,
  agentModelStore,
  AgentNameEnum,
  LLMProviderEnum,
  llmProviderModelNames,
} from '@bass/storage';

export const ModelSettings = () => {
  const [apiKeys, setApiKeys] = useState<Record<LLMProviderEnum, { apiKey: string; baseUrl?: string }>>(
    {} as Record<LLMProviderEnum, { apiKey: string; baseUrl?: string }>,
  );
  const [modifiedProviders, setModifiedProviders] = useState<Set<LLMProviderEnum>>(new Set());
  const [selectedModels, setSelectedModels] = useState<Record<AgentNameEnum, string>>({
    [AgentNameEnum.Navigator]: '',
    [AgentNameEnum.Planner]: '',
    [AgentNameEnum.Validator]: '',
  });

  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const providers = await llmProviderStore.getConfiguredProviders();

        const keys: Record<LLMProviderEnum, { apiKey: string; baseUrl?: string }> = {} as Record<
          LLMProviderEnum,
          { apiKey: string; baseUrl?: string }
        >;

        for (const provider of providers) {
          const config = await llmProviderStore.getProvider(provider);
          if (config) {
            keys[provider] = config;
          }
        }
        setApiKeys(keys);
      } catch (error) {
        console.error('Error loading API keys:', error);
        setApiKeys({} as Record<LLMProviderEnum, { apiKey: string; baseUrl?: string }>);
      }
    };

    loadApiKeys();
  }, []);

  // Load existing agent models on mount
  useEffect(() => {
    const loadAgentModels = async () => {
      try {
        const models: Record<AgentNameEnum, string> = {
          [AgentNameEnum.Planner]: '',
          [AgentNameEnum.Navigator]: '',
          [AgentNameEnum.Validator]: '',
        };

        for (const agent of Object.values(AgentNameEnum)) {
          const config = await agentModelStore.getAgentModel(agent);
          if (config) {
            models[agent] = config.modelName;
          }
        }
        setSelectedModels(models);
      } catch (error) {
        console.error('Error loading agent models:', error);
      }
    };

    loadAgentModels();
  }, []);

  const handleApiKeyChange = (provider: LLMProviderEnum, apiKey: string, baseUrl?: string) => {
    setModifiedProviders(prev => new Set(prev).add(provider));
    setApiKeys(prev => ({
      ...prev,
      [provider]: {
        apiKey: apiKey.trim(),
        baseUrl: baseUrl !== undefined ? baseUrl.trim() : prev[provider]?.baseUrl,
      },
    }));
  };

  const handleSave = async (provider: LLMProviderEnum) => {
    try {
      await llmProviderStore.setProvider(provider, apiKeys[provider]);
      setModifiedProviders(prev => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleDelete = async (provider: LLMProviderEnum) => {
    try {
      await llmProviderStore.removeProvider(provider);
      setApiKeys(prev => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const getButtonProps = (provider: LLMProviderEnum) => {
    const hasStoredKey = Boolean(apiKeys[provider]?.apiKey);
    const isModified = modifiedProviders.has(provider);
    const hasInput = Boolean(apiKeys[provider]?.apiKey?.trim());

    if (hasStoredKey && !isModified) {
      return {
        variant: 'destructive' as const,
        children: 'Delete',
        disabled: false,
      };
    }

    return {
      variant: 'default' as const,
      children: 'Save',
      disabled: !hasInput || !isModified,
    };
  };

  const getAvailableModels = () => {
    const models: string[] = [];
    Object.entries(apiKeys).forEach(([provider, config]) => {
      if (config.apiKey) {
        models.push(...(llmProviderModelNames[provider as LLMProviderEnum] || []));
      }
    });
    return models.length ? models : [''];
  };

  const handleModelChange = async (agentName: AgentNameEnum, model: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [agentName]: model,
    }));

    try {
      if (model) {
        // Determine provider from model name
        let provider: LLMProviderEnum | undefined;
        for (const [providerKey, models] of Object.entries(llmProviderModelNames)) {
          if (models.includes(model)) {
            provider = providerKey as LLMProviderEnum;
            break;
          }
        }

        if (provider) {
          await agentModelStore.setAgentModel(agentName, {
            provider,
            modelName: model,
          });
        }
      } else {
        // Reset storage if no model is selected
        await agentModelStore.resetAgentModel(agentName);
      }
    } catch (error) {
      console.error('Error saving agent model:', error);
    }
  };

  const renderModelSelect = (agentName: AgentNameEnum) => (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium">{agentName.charAt(0).toUpperCase() + agentName.slice(1)}</h3>
        <p className="text-sm font-normal">{getAgentDescription(agentName)}</p>
      </div>
      <Select
        disabled={getAvailableModels().length <= 1}
        value={selectedModels[agentName] || ''}
        onValueChange={(value: string) => handleModelChange(agentName, value)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Choose model" />
        </SelectTrigger>
        <SelectContent>
          {getAvailableModels().map(
            model =>
              model && (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ),
          )}
        </SelectContent>
      </Select>
    </div>
  );

  const getAgentDescription = (agentName: AgentNameEnum) => {
    switch (agentName) {
      case AgentNameEnum.Navigator:
        return 'Navigates websites and performs actions';
      case AgentNameEnum.Planner:
        return 'Develops and refines strategies to complete tasks';
      case AgentNameEnum.Validator:
        return 'Checks if tasks are completed successfully';
      default:
        return '';
    }
  };

  return (
    <section className="space-y-6">
      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* DeepSeek Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">DeepSeek</h3>
              <Button
                {...getButtonProps(LLMProviderEnum.Deepseek)}
                size="sm"
                onClick={() =>
                  apiKeys[LLMProviderEnum.Deepseek]?.apiKey && !modifiedProviders.has(LLMProviderEnum.Deepseek)
                    ? handleDelete(LLMProviderEnum.Deepseek)
                    : handleSave(LLMProviderEnum.Deepseek)
                }>
                {apiKeys[LLMProviderEnum.Deepseek]?.apiKey && !modifiedProviders.has(LLMProviderEnum.Deepseek)
                  ? 'Delete'
                  : 'Save'}
              </Button>
            </div>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="DeepSeek API key"
                value={apiKeys[LLMProviderEnum.Deepseek]?.apiKey || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleApiKeyChange(LLMProviderEnum.Deepseek, e.target.value)
                }
              />
              <Input
                type="text"
                placeholder="Custom Base URL (Optional)"
                value={apiKeys[LLMProviderEnum.Deepseek]?.baseUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleApiKeyChange(
                    LLMProviderEnum.Deepseek,
                    apiKeys[LLMProviderEnum.Deepseek]?.apiKey || '',
                    e.target.value,
                  )
                }
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* OpenAI Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">OpenAI</h3>
              <Button
                {...getButtonProps(LLMProviderEnum.OpenAI)}
                size="sm"
                onClick={() =>
                  apiKeys[LLMProviderEnum.OpenAI]?.apiKey && !modifiedProviders.has(LLMProviderEnum.OpenAI)
                    ? handleDelete(LLMProviderEnum.OpenAI)
                    : handleSave(LLMProviderEnum.OpenAI)
                }>
                {apiKeys[LLMProviderEnum.OpenAI]?.apiKey && !modifiedProviders.has(LLMProviderEnum.OpenAI)
                  ? 'Delete'
                  : 'Save'}
              </Button>
            </div>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="OpenAI API key"
                value={apiKeys[LLMProviderEnum.OpenAI]?.apiKey || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleApiKeyChange(LLMProviderEnum.OpenAI, e.target.value)
                }
              />
              <Input
                type="text"
                placeholder="Custom Base URL (Optional)"
                value={apiKeys[LLMProviderEnum.OpenAI]?.baseUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleApiKeyChange(
                    LLMProviderEnum.OpenAI,
                    apiKeys[LLMProviderEnum.OpenAI]?.apiKey || '',
                    e.target.value,
                  )
                }
              />
            </div>
          </div>

          <Separator className="my-4" />

          {/* Anthropic Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Anthropic</h3>
              <Button
                {...getButtonProps(LLMProviderEnum.Anthropic)}
                size="sm"
                onClick={() =>
                  apiKeys[LLMProviderEnum.Anthropic]?.apiKey && !modifiedProviders.has(LLMProviderEnum.Anthropic)
                    ? handleDelete(LLMProviderEnum.Anthropic)
                    : handleSave(LLMProviderEnum.Anthropic)
                }>
                {apiKeys[LLMProviderEnum.Anthropic]?.apiKey && !modifiedProviders.has(LLMProviderEnum.Anthropic)
                  ? 'Delete'
                  : 'Save'}
              </Button>
            </div>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Anthropic API key"
                value={apiKeys[LLMProviderEnum.Anthropic]?.apiKey || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleApiKeyChange(LLMProviderEnum.Anthropic, e.target.value)
                }
              />
              <Input
                type="text"
                placeholder="Custom Base URL (Optional)"
                value={apiKeys[LLMProviderEnum.Anthropic]?.baseUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleApiKeyChange(
                    LLMProviderEnum.Anthropic,
                    apiKeys[LLMProviderEnum.Anthropic]?.apiKey || '',
                    e.target.value,
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updated Agent Models Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Model Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[AgentNameEnum.Planner, AgentNameEnum.Navigator, AgentNameEnum.Validator].map(agentName => (
            <div key={agentName}>{renderModelSelect(agentName)}</div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};
