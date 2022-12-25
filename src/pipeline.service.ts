import { CodefreshHttpClient } from './codefresh.http-client.ts';
import { DELETED_TRIGGERS_KEY, DISABLED_TRIGGERS_KEY } from './const.ts';
import type { Annotation } from './types.ts';

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
      console.log('📃 There are no enabled git triggers, nothing to disable');
      return;
    }

    const gitTriggersToDisable = enabledGitTriggers.map((trigger) => {
      trigger.disabled = true;
      return trigger.name;
    });
    console.log(
      '📃 Following git triggers will be disabled:\n\t',
      gitTriggersToDisable,
    );

    await this.#httpClient.replacePipeline(pipelineId, pipeline);
    console.log(
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
      console.log(
        `✅ "${DISABLED_TRIGGERS_KEY}" annotation was added to the pipeline`,
      );
    } else {
      console.error(`❌ Unable to add "${DISABLED_TRIGGERS_KEY}" annotation`);
    }
  }

  public async deleteTriggers(pipelineId: string): Promise<void> {
    const triggers = await this.#httpClient.getPipelineTriggers(
      pipelineId,
      true,
    );
    if (!triggers) {
      console.log('📃 There are no triggers, nothing to delete');
      return;
    }

    const triggerURIsToDelete = triggers.map((trigger) =>
      trigger['event-data'].uri
    );
    console.log(
      '📃 Following triggers will be deleted:\n\t',
      triggerURIsToDelete,
    );
    await Promise.all(
      triggerURIsToDelete.map((URI) =>
        this.#httpClient.deleteTriggerFromPipeline(URI, pipelineId)
      ),
    );
    console.log(
      '✅ Following triggers were deleted:\n\t',
      triggerURIsToDelete,
    );

    const annotation = await this.#httpClient.createAnntotation(
      pipelineId,
      'pipeline',
      DELETED_TRIGGERS_KEY,
      triggerURIsToDelete,
    );
    if (annotation) {
      console.log(
        `✅ "${DELETED_TRIGGERS_KEY}" annotation was added to the pipeline`,
      );
    } else {
      console.error(`❌ Unable to add "${DELETED_TRIGGERS_KEY}" annotation`);
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
      console.log(
        '📃 There are no previously disabled git triggers, nothing to enable',
      );
      return;
    }
    pipeline.spec.triggers.forEach((trigger) => {
      if (disabledGitTriggers.includes(trigger.name)) {
        trigger.disabled = false;
      }
    });
    console.log(
      '📃 Following git triggers will be enabled:\n\t',
      disabledGitTriggers,
    );
    await this.#httpClient.replacePipeline(pipelineId, pipeline);
    console.log(
      '✅ Following git triggers were enabled:\n\t',
      disabledGitTriggers,
    );

    await this.#httpClient.deleteAnntotation(
      pipelineId,
      'pipeline',
      DISABLED_TRIGGERS_KEY,
    );
    console.log(
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
    const deletedTriggers = <string[] | undefined> deletedTriggersAnnotation
      ?.value;
    if (!deletedTriggers) {
      console.log(
        '📃 There are no previously deleted triggers, nothing to create',
      );
      return;
    }
    console.log(
      '📃 Following triggers will be created:\n\t',
      deletedTriggers,
    );
    await Promise.all(
      deletedTriggers.map((URI) =>
        this.#httpClient.createTriggerForPipeline(URI, pipelineId)
      ),
    );
    console.log(
      '✅ Following triggers were created:\n\t',
      deletedTriggers,
    );

    await this.#httpClient.deleteAnntotation(
      pipelineId,
      'pipeline',
      DELETED_TRIGGERS_KEY,
    );
    console.log(
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
