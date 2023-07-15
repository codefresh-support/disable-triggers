import { CodefreshHttpClient } from './codefresh.http-client.ts';
import { DELETED_TRIGGERS_KEY, DISABLED_TRIGGERS_KEY } from './const.ts';
import { base64 } from './deps.ts';
import { logger } from './logger.service.ts';
import type { Annotation, Trigger } from './types.ts';

export class PipelineService {
  #httpClient: CodefreshHttpClient;

  constructor(httpClinet: CodefreshHttpClient) {
    this.#httpClient = httpClinet;
  }

  public async disableGitTriggers(pipelineId: string): Promise<void> {
    const pipeline = await this.#httpClient.getPipeline(pipelineId);

    const enabledGitTriggers = pipeline.spec.triggers.filter((trigger) =>
      !trigger.disabled
    );

    if (enabledGitTriggers.length === 0) {
      logger.log('📃 There are no enabled git triggers, nothing to disable');
      return;
    }

    const gitTriggersToDisable = enabledGitTriggers.map((trigger) => {
      trigger.disabled = true;
      return trigger.name;
    });
    logger.log(
      '📃 Following git triggers will be disabled:\n\t',
      gitTriggersToDisable,
    );

    await this.#httpClient.replacePipeline(pipelineId, pipeline);
    logger.log(
      '✅ Following git triggers were disabled:\n\t',
      gitTriggersToDisable,
    );

    const annotation = await this.#httpClient.createAnntotation(
      pipelineId,
      'pipeline',
      DISABLED_TRIGGERS_KEY,
      gitTriggersToDisable,
    );
    if (annotation) {
      logger.log(
        `✅ "${DISABLED_TRIGGERS_KEY}" annotation was added to the pipeline`,
      );
    } else {
      logger.error(`❌ Unable to add "${DISABLED_TRIGGERS_KEY}" annotation`);
    }
  }

  public async deleteTriggers(pipelineId: string): Promise<void> {
    const triggers = await this.#httpClient.getPipelineTriggers(
      pipelineId,
      true,
    );
    if (!triggers) {
      logger.log('📃 There are no triggers, nothing to delete');
      return;
    }

    const triggerURIsToDelete = triggers.map((trigger) =>
      trigger['event-data'].uri
    );
    logger.log(
      '📃 Following triggers will be deleted:\n\t',
      triggerURIsToDelete,
    );
    await Promise.all(
      triggerURIsToDelete.map((URI) =>
        this.#httpClient.deleteTriggerFromPipeline(URI, pipelineId)
      ),
    );
    logger.log(
      '✅ Following triggers were deleted:\n\t',
      triggerURIsToDelete,
    );

    const annotation = await this.#httpClient.createAnntotation(
      pipelineId,
      'pipeline',
      DELETED_TRIGGERS_KEY,
      base64.encode(JSON.stringify(triggers)),
    );
    if (annotation) {
      logger.log(
        `✅ "${DELETED_TRIGGERS_KEY}" annotation was added to the pipeline`,
      );
    } else {
      logger.error(`❌ Unable to add "${DELETED_TRIGGERS_KEY}" annotation`);
    }
  }

  async #enableGitTriggers(
    pipelineId: string,
    annotations: Annotation[],
  ): Promise<void> {
    const pipeline = await this.#httpClient.getPipeline(pipelineId);
    const disabledTriggersAnnotation = annotations.find((annotation) =>
      annotation.key === DISABLED_TRIGGERS_KEY
    );
    const disabledGitTriggers = <
      | string[]
      | undefined
    > disabledTriggersAnnotation?.value;
    if (!disabledGitTriggers) {
      logger.log(
        '📃 There are no previously disabled git triggers, nothing to enable',
      );
      return;
    }
    pipeline.spec.triggers.forEach((trigger) => {
      if (disabledGitTriggers.includes(trigger.name)) {
        trigger.disabled = false;
      }
    });
    logger.log(
      '📃 Following git triggers will be enabled:\n\t',
      disabledGitTriggers,
    );
    await this.#httpClient.replacePipeline(pipelineId, pipeline);
    logger.log(
      '✅ Following git triggers were enabled:\n\t',
      disabledGitTriggers,
    );

    await this.#httpClient.deleteAnntotation(
      pipelineId,
      'pipeline',
      DISABLED_TRIGGERS_KEY,
    );
    logger.log(
      `✅ "${DISABLED_TRIGGERS_KEY}" annotation was deleted from the pipeline`,
    );
  }

  async #createTriggers(
    pipelineId: string,
    annotations: Annotation[],
  ): Promise<void> {
    const deletedTriggersAnnotation = annotations.find((annotation) =>
      annotation.key === DELETED_TRIGGERS_KEY
    );
    if (!deletedTriggersAnnotation?.value) {
      logger.log(
        '📃 There are no previously deleted triggers, nothing to create',
      );
      return;
    }

    const deletedTriggers: Trigger<true>[] = JSON.parse(
      new TextDecoder().decode(base64.decode(deletedTriggersAnnotation.value)),
    );
    const deletedTriggersURIs = deletedTriggers.map((trigger) =>
      trigger['event-data'].uri
    );
    logger.log(
      '📃 Following triggers will be created:\n\t',
      deletedTriggersURIs,
    );
    await Promise.all(
      deletedTriggers.map((trigger) =>
        this.#httpClient.createTriggerForPipeline(
          trigger['event-data'].uri,
          pipelineId,
          trigger,
        )
      ),
    );
    logger.log(
      '✅ Following triggers were created:\n\t',
      deletedTriggersURIs,
    );

    await this.#httpClient.deleteAnntotation(
      pipelineId,
      'pipeline',
      DELETED_TRIGGERS_KEY,
    );
    logger.log(
      `✅ "${DELETED_TRIGGERS_KEY}" annotation was deleted from the pipeline`,
    );
  }

  public async reenableTriggers(pipelineId: string): Promise<void> {
    const annotations = await this.#httpClient.getAnntotations(
      pipelineId,
      'pipeline',
    );

    await Promise.all([
      this.#enableGitTriggers(pipelineId, annotations),
      this.#createTriggers(pipelineId, annotations),
    ]);
  }
}
