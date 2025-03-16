import 'webextension-polyfill';
import { agentModelStore, AgentNameEnum, generalSettingsStore, llmProviderStore } from '@bass/storage';
import BrowserContext from './browser/context';
import { Executor } from './agent/executor';
import { createLogger } from './log';
import { ExecutionState } from './agent/event/types';
import { createChatModel } from './agent/helper';

const logger = createLogger('background');

const browserContext = new BrowserContext({});
let currentExecutor: Executor | null = null;
let currentPort: chrome.runtime.Port | null = null;

// Setup side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => logger.error(error));

// Function to check if script is already injected
async function isScriptInjected(tabId: number): Promise<boolean> {
  logger.info(`Checking if script is injected for tab ${tabId}`);
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => Object.prototype.hasOwnProperty.call(window, 'buildDomTree'),
    });
    const isInjected = results[0]?.result || false;
    logger.debug(`Script injection status for tab ${tabId}: ${isInjected}`);
    return isInjected;
  } catch (err) {
    logger.error('Failed to check script injection status:', err);
    return false;
  }
}

// Function to inject the buildDomTree script
async function injectBuildDomTree(tabId: number) {
  logger.info(`Attempting to inject buildDomTree script into tab ${tabId}`);
  try {
    // Check if already injected
    const alreadyInjected = await isScriptInjected(tabId);
    if (alreadyInjected) {
      logger.info('Scripts already injected, skipping...');
      return;
    }

    logger.debug('Proceeding with script injection');
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['buildDomTree.js'],
    });
    logger.info('Scripts successfully injected');
  } catch (err) {
    logger.error('Failed to inject scripts:', err);
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId && changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    await injectBuildDomTree(tabId);
  }
});

// Listen for debugger detached event
// if canceled_by_user, remove the tab from the browser context
chrome.debugger.onDetach.addListener(async (source, reason) => {
  logger.info('Debugger detached:', source, reason);
  if (reason === 'canceled_by_user') {
    if (source.tabId) {
      await browserContext.cleanup();
    }
  }
});

// Cleanup when tab is closed
chrome.tabs.onRemoved.addListener(tabId => {
  browserContext.removeAttachedPage(tabId);
});

logger.info('service worker loaded');

// Setup connection listener
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'side-panel-connection') {
    logger.info('Side panel connected');
    currentPort = port;

    port.onMessage.addListener(async message => {
      try {
        logger.debug(`Received message of type: ${message.type}`, { messageType: message.type });
        switch (message.type) {
          case 'heartbeat':
            // Acknowledge heartbeat
            logger.debug('Processing heartbeat message');
            port.postMessage({ type: 'heartbeat_ack' });
            break;

          case 'new_task': {
            if (!message.task) {
              logger.error('New task received without task content');
              return port.postMessage({ type: 'error', error: 'No task provided' });
            }
            if (!message.tabId) {
              logger.error('New task received without tab ID');
              return port.postMessage({ type: 'error', error: 'No tab ID provided' });
            }

            logger.info('Processing new task', { tabId: message.tabId, taskId: message.taskId });
            currentExecutor = await setupExecutor(message.taskId, message.task, browserContext);
            subscribeToExecutorEvents(currentExecutor);

            const result = await currentExecutor.execute();
            logger.info('New task execution completed', { tabId: message.tabId, result });
            break;
          }
          case 'follow_up_task': {
            if (!message.task) return port.postMessage({ type: 'error', error: 'No follow up task provided' });
            if (!message.tabId) return port.postMessage({ type: 'error', error: 'No tab ID provided' });

            logger.info('follow_up_task', message.tabId, message.task);

            // If executor exists, add follow-up task
            if (currentExecutor) {
              currentExecutor.addFollowUpTask(message.task);
              // Re-subscribe to events in case the previous subscription was cleaned up
              subscribeToExecutorEvents(currentExecutor);
              const result = await currentExecutor.execute();
              logger.info('follow_up_task execution result', message.tabId, result);
            } else {
              // executor was cleaned up, can not add follow-up task
              logger.info('follow_up_task: executor was cleaned up, can not add follow-up task');
              return port.postMessage({ type: 'error', error: 'Executor was cleaned up, can not add follow-up task' });
            }
            break;
          }

          case 'cancel_task': {
            if (!currentExecutor) return port.postMessage({ type: 'error', error: 'No task to cancel' });
            await currentExecutor.cancel();
            break;
          }

          case 'screenshot': {
            if (!message.tabId) return port.postMessage({ type: 'error', error: 'No tab ID provided' });
            const page = await browserContext.switchTab(message.tabId);
            const screenshot = await page.takeScreenshot();
            logger.info('screenshot', message.tabId, screenshot);
            return port.postMessage({ type: 'success', screenshot });
          }

          case 'resume_task': {
            if (!currentExecutor) return port.postMessage({ type: 'error', error: 'No task to resume' });
            await currentExecutor.resume();
            return port.postMessage({ type: 'success' });
          }

          case 'pause_task': {
            if (!currentExecutor) return port.postMessage({ type: 'error', error: 'No task to pause' });
            await currentExecutor.pause();
            return port.postMessage({ type: 'success' });
          }
          default:
            return port.postMessage({ type: 'error', error: 'Unknown message type' });
        }
      } catch (error) {
        logger.error('Error handling port message:', error);
        port.postMessage({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    port.onDisconnect.addListener(() => {
      logger.info('Side panel disconnected');
      currentPort = null;
    });
  }
});

async function setupExecutor(taskId: string, task: string, browserContext: BrowserContext) {
  logger.info('Setting up executor', { taskId });
  const providers = await llmProviderStore.getAllProviders();
  // if no providers, need to display the options page
  if (Object.keys(providers).length === 0) {
    logger.error('No LLM providers configured');
    throw new Error('Please configure API keys in the settings first');
  }
  const agentModels = await agentModelStore.getAllAgentModels();
  // verify if every provider used in the agent models exists in the providers
  for (const agentModel of Object.values(agentModels)) {
    if (!providers[agentModel.provider]) {
      logger.error(`Missing provider configuration`, { provider: agentModel.provider });
      throw new Error(`Provider ${agentModel.provider} not found in the settings`);
    }
  }

  const navigatorModel = agentModels[AgentNameEnum.Navigator];
  if (!navigatorModel) {
    throw new Error('Please choose a model for the navigator in the settings first');
  }
  const navigatorLLM = createChatModel(
    AgentNameEnum.Navigator,
    navigatorModel.provider,
    providers[navigatorModel.provider],
    navigatorModel.modelName,
  );

  let plannerLLM = null;
  const plannerModel = agentModels[AgentNameEnum.Planner];
  if (plannerModel) {
    plannerLLM = createChatModel(
      AgentNameEnum.Planner,
      plannerModel.provider,
      providers[plannerModel.provider],
      plannerModel.modelName,
    );
  }

  let validatorLLM = null;
  const validatorModel = agentModels[AgentNameEnum.Validator];
  if (validatorModel) {
    validatorLLM = createChatModel(
      AgentNameEnum.Validator,
      validatorModel.provider,
      providers[validatorModel.provider],
      validatorModel.modelName,
    );
  }

  const generalSettings = await generalSettingsStore.getSettings();
  const executor = new Executor(task, taskId, browserContext, navigatorLLM, {
    plannerLLM: plannerLLM ?? navigatorLLM,
    validatorLLM: validatorLLM ?? navigatorLLM,
    agentOptions: {
      maxSteps: generalSettings.maxSteps,
      maxFailures: generalSettings.maxFailures,
      maxActionsPerStep: generalSettings.maxActionsPerStep,
      useVision: generalSettings.useVision,
      useVisionForPlanner: generalSettings.useVisionForPlanner,
      planningInterval: generalSettings.planningInterval,
    },
  });

  return executor;
}

// Update subscribeToExecutorEvents to use port
async function subscribeToExecutorEvents(executor: Executor) {
  // Clear previous event listeners to prevent multiple subscriptions
  executor.clearExecutionEvents();

  // Subscribe to new events
  executor.subscribeExecutionEvents(async event => {
    try {
      if (currentPort) {
        currentPort.postMessage(event);
      }
    } catch (error) {
      logger.error('Failed to send message to side panel:', error);
    }

    if (
      event.state === ExecutionState.TASK_OK ||
      event.state === ExecutionState.TASK_FAIL ||
      event.state === ExecutionState.TASK_CANCEL
    ) {
      await currentExecutor?.cleanup();
    }
  });
}
