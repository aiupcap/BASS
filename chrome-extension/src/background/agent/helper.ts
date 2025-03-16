import { type ProviderConfig, LLMProviderEnum, AgentNameEnum } from '@bass/storage';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatDeepSeek } from '@langchain/deepseek';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

// create a chat model based on the agent name, the model name and provider
export function createChatModel(
  agentName: string,
  providerName: LLMProviderEnum,
  providerConfig: ProviderConfig,
  modelName: string,
): BaseChatModel {
  const maxTokens = 2000;
  const maxCompletionTokens = 5000;
  let temperature = 0;
  let topP = 0.001;
  switch (providerName) {
    case LLMProviderEnum.OpenAI: {
      if (agentName === AgentNameEnum.Planner) {
        temperature = 0.02;
      }
      const args: any = {
        model: modelName,
        apiKey: providerConfig.apiKey,
        configuration: {},
      };
      if (providerConfig.baseUrl) {
        args.configuration = {
          baseURL: providerConfig.baseUrl,
        };
      }

      // O series models have different parameters
      if (modelName.startsWith('o')) {
        args.modelKwargs = {
          max_completion_tokens: maxCompletionTokens,
        };
      } else {
        args.topP = topP;
        args.temperature = temperature;
        args.maxTokens = maxTokens;
      }
      return new ChatOpenAI(args);
    }
    case LLMProviderEnum.Groq: {
      temperature = 0.1;
      topP = 0.1;
      const args: any = {
        model: modelName,
        apiKey: providerConfig.apiKey,
        temperature,
        topP,
        maxTokens,
        configuration: {},
      };
      if (providerConfig.baseUrl) {
        args.configuration = {
          baseURL: providerConfig.baseUrl,
        };
      }
      // Use OpenAI client for Groq since it's compatible with OpenAI API
      return new ChatOpenAI(args);
    }
    case LLMProviderEnum.Anthropic: {
      temperature = 0.1;
      topP = 0.1;
      const args = {
        model: modelName,
        apiKey: providerConfig.apiKey,
        maxTokens,
        temperature,
        topP,
        clientOptions: {},
      };
      if (providerConfig.baseUrl) {
        args.clientOptions = {
          baseURL: providerConfig.baseUrl,
        };
      }
      return new ChatAnthropic(args);
    }
    case LLMProviderEnum.Deepseek: {
      temperature = 0.0;
      topP = 0.1;
      const args = {
        model: modelName,
        apiKey: providerConfig.apiKey,
        maxTokens,
        temperature,
        topP,
        clientOptions: {},
      };
      if (providerConfig.baseUrl) {
        args.clientOptions = {
          baseURL: providerConfig.baseUrl,
        };
      }
      return new ChatDeepSeek(args);
    }
    default: {
      throw new Error(`Provider ${providerName} not supported yet`);
    }
  }
}
