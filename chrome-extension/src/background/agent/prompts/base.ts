import { HumanMessage, type SystemMessage } from '@langchain/core/messages';
import type { AgentContext } from '../../agent/types';
import { createLogger } from '../../log';

const logger = createLogger('agent/prompts/base');

/**
 * Abstract base class for all prompt types
 */
abstract class BasePrompt {
  /**
   * Returns the system message that defines the AI's role and behavior
   * @returns SystemMessage from LangChain
   */
  abstract getSystemMessage(): SystemMessage;

  /**
   * Returns the user message for the specific prompt type
   * @param context - Optional context data needed for generating the user message
   * @returns HumanMessage from LangChain
   */
  abstract getUserMessage(context: AgentContext): Promise<HumanMessage>;

  /**
   * Builds the user message containing the browser state
   * @param context - The agent context
   * @returns HumanMessage from LangChain
   */
  async buildBrowserStateUserMessage(context: AgentContext): Promise<HumanMessage> {
    logger.debug('Building browser state user message');

    const browserState = await context.browserContext.getState();
    logger.debug(`Retrieved browser state for tab ${browserState.tabId}`);

    const elementsText = browserState.elementTree.clickableElementsToString(context.options.includeAttributes);
    logger.debug(`Generated elements text, length: ${elementsText.length} characters`);

    const hasContentAbove = (browserState.pixelsAbove || 0) > 0;
    const hasContentBelow = (browserState.pixelsBelow || 0) > 0;
    logger.debug(`Page scroll state - content above: ${hasContentAbove}, content below: ${hasContentBelow}`);

    let formattedElementsText = '';
    if (elementsText !== '') {
      if (hasContentAbove) {
        formattedElementsText = `... ${browserState.pixelsAbove} pixels above - scroll up to see more ...\n${elementsText}`;
      } else {
        formattedElementsText = `[Start of page]\n${elementsText}`;
      }

      if (hasContentBelow) {
        formattedElementsText = `${formattedElementsText}\n... ${browserState.pixelsBelow} pixels below - scroll down to see more ...`;
      } else {
        formattedElementsText = `${formattedElementsText}\n[End of page]`;
      }
    } else {
      formattedElementsText = 'empty page';
      logger.warn('No clickable elements found on the page');
    }

    let stepInfoDescription = '';
    if (context.stepInfo) {
      stepInfoDescription = `Current step: ${context.stepInfo.stepNumber + 1}/${context.stepInfo.maxSteps}`;
      logger.debug(`Step info: ${stepInfoDescription}`);
    }

    const timeStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    stepInfoDescription += `Current date and time: ${timeStr}`;

    let actionResultsDescription = '';
    if (context.actionResults.length > 0) {
      logger.debug(`Processing ${context.actionResults.length} action results`);
      for (let i = 0; i < context.actionResults.length; i++) {
        const result = context.actionResults[i];
        if (result.extractedContent) {
          actionResultsDescription += `\nAction result ${i + 1}/${context.actionResults.length}: ${result.extractedContent}`;
        }
        if (result.error) {
          const error = result.error.slice(-300);
          actionResultsDescription += `\nAction error ${i + 1}/${context.actionResults.length}: ...${error}`;
          logger.error(`Action ${i + 1} failed with error: ${error}`);
        }
      }
    }

    const stateDescription = `
    [Task history memory ends here]
    [Current state starts here]
    You will see the following only once - if you need to remember it and you dont know it yet, write it down in the memory:
    Current tab: {id: ${browserState.tabId}, url: ${browserState.url}, title: ${browserState.title}}
    Other available tabs:
    ${browserState.tabs
      .filter(tab => tab.id !== browserState.tabId)
      .map(tab => ` - {id: ${tab.id}, url: ${tab.url}, title: ${tab.title}}`)
      .join('\n')}
    Interactive elements from current page:
    ${formattedElementsText}
    ${stepInfoDescription}
    ${actionResultsDescription}`;

    if (browserState.screenshot && context.options.useVision) {
      logger.debug('Including screenshot in message');
      return new HumanMessage({
        content: [
          { type: 'text', text: stateDescription },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${browserState.screenshot}` },
          },
        ],
      });
    }

    logger.debug('Returning text-only message');
    return new HumanMessage(stateDescription);
  }
}

export { BasePrompt };
