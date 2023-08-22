import {
  DELETED_TRIGGERS_KEY,
  DISABLED_CRON_TRIGGERS_KEY,
  DISABLED_GIT_TRIGGERS_KEY,
} from './const.ts';
import { base64 } from './deps.ts';
import { logger } from './logger.service.ts';

import type { CodefreshHttpClient } from './codefresh.http-client.ts';
import type { Annotation, Trigger } from './types.ts';

export class PipelineService {
  #httpClient: CodefreshHttpClient;

  constructor(httpClinet: CodefreshHttpClient) {
    this.#httpClient = httpClinet;
  }

  public async disableSpecTriggersByPipeline(
    pipelineId: string,
  ): Promise<void> {
    const pipeline = await this.#httpClient.getPipeline(pipelineId);

    const enabledGitTriggers = pipeline.spec.triggers.filter((trigger) =>
      !trigger.disabled
    );
    const enabledCronTriggers = pipeline.spec.cronTriggers?.filter((trigger) =>
      !trigger.disabled
    );

    if (enabledGitTriggers.length === 0 && enabledCronTriggers?.length === 0) {
      logger.log(
        `[Pipeline #${pipelineId}] There are no enabled triggers, nothing to disable`,
      );
      return;
    }

    const gitTriggersToDisable = enabledGitTriggers.map((trigger) => {
      trigger.disabled = true;
      return trigger.id;
    });
    const cronTriggersToDisable = enabledCronTriggers?.map((trigger) => {
      trigger.disabled = true;
      return trigger.id;
    });
    logger.log(
      `[Pipeline #${pipelineId}] Following triggers will be disabled: `,
      gitTriggersToDisable,
      cronTriggersToDisable,
    );

    await this.#httpClient.replacePipeline(pipelineId, pipeline);
    logger.log(
      `[Pipeline #${pipelineId}] Following triggers were disabled: `,
      gitTriggersToDisable,
      cronTriggersToDisable,
    );

    const [gitAnnotation, cronAnnotation] = await Promise.all([
      this.#httpClient.createAnntotation(
        pipelineId,
        'pipeline',
        DISABLED_GIT_TRIGGERS_KEY,
        gitTriggersToDisable,
      ),
      this.#httpClient.createAnntotation(
        pipelineId,
        'pipeline',
        DISABLED_CRON_TRIGGERS_KEY,
        cronTriggersToDisable,
      ),
    ]);

    gitAnnotation
      ? logger.log(
        `[Pipeline #${pipelineId}] "${DISABLED_GIT_TRIGGERS_KEY}" annotation was added to the pipeline`,
      )
      : logger.error(
        `[Pipeline #${pipelineId}] Unable to add "${DISABLED_GIT_TRIGGERS_KEY}" annotation`,
      );

    cronAnnotation
      ? logger.log(
        `[Pipeline #${pipelineId}] "${DISABLED_CRON_TRIGGERS_KEY}" annotation was added to the pipeline`,
      )
      : logger.error(
        `[Pipeline #${pipelineId}] Unable to add "${DISABLED_CRON_TRIGGERS_KEY}" annotation`,
      );
  }

  public async deleteTriggersByPipeline(pipelineId: string): Promise<void> {
    const triggers = await this.#httpClient.getPipelineTriggers(
      pipelineId,
      true,
    );
    logger.debug(`[Pipeline #${pipelineId}] Triggers to be deleted:`, triggers);
    if (!triggers) {
      logger.log(
        `[Pipeline #${pipelineId}] There are no triggers, nothing to delete`,
      );
      return;
    }

    const triggerURIsToDelete = triggers.map((trigger) =>
      trigger['event-data'].uri
    );
    logger.log(
      `[Pipeline #${pipelineId}] Following triggers will be deleted: `,
      triggerURIsToDelete,
    );
    await Promise.all(
      triggerURIsToDelete.map((URI) =>
        this.#httpClient.deleteTriggerFromPipeline(URI, pipelineId)
      ),
    );
    logger.log(
      `[Pipeline #${pipelineId}] Following triggers were deleted: `,
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
        `[Pipeline #${pipelineId}] "${DELETED_TRIGGERS_KEY}" annotation was added to the pipeline`,
      );
    } else {
      logger.error(
        `[Pipeline #${pipelineId}] Unable to add "${DELETED_TRIGGERS_KEY}" annotation`,
      );
    }
  }

  async #enableSpecTriggers(
    pipelineId: string,
    annotations: Annotation[],
  ): Promise<void> {
    let disabledGitTriggersAnnotation: Annotation | undefined;
    let disabledCronTriggersAnnotation: Annotation | undefined;
    annotations.forEach((annotation) => {
      if (annotation.key === DISABLED_GIT_TRIGGERS_KEY) {
        disabledGitTriggersAnnotation = annotation;
      }
      if (annotation.key === DISABLED_CRON_TRIGGERS_KEY) {
        disabledCronTriggersAnnotation = annotation;
      }
    });

    if (!disabledGitTriggersAnnotation && !disabledCronTriggersAnnotation) {
      logger.log(
        `[Pipeline #${pipelineId}] There are no previously disabled triggers, nothing to enable`,
      );
      return;
    }

    const pipeline = await this.#httpClient.getPipeline(pipelineId);

    const disabledGitTriggers: string[] | undefined =
      disabledGitTriggersAnnotation?.value;
    const disabledCronTriggers: string[] | undefined =
      disabledCronTriggersAnnotation?.value;

    if (disabledGitTriggers?.length) {
      pipeline.spec.triggers.forEach((trigger) => {
        if (disabledGitTriggers?.includes(trigger.id)) {
          trigger.disabled = false;
        }
      });
      logger.log(
        `[Pipeline #${pipelineId}] Following git triggers will be enabled: `,
        disabledGitTriggers,
      );
    }

    if (disabledCronTriggers?.length) {
      pipeline.spec.cronTriggers?.forEach((trigger) => {
        if (disabledCronTriggers?.includes(trigger.id)) {
          trigger.disabled = false;
        }
      });
      logger.log(
        `[Pipeline #${pipelineId}] Following cron triggers will be enabled: `,
        disabledCronTriggers,
      );
    }

    await this.#httpClient.replacePipeline(pipelineId, pipeline);
    logger.log(
      `[Pipeline #${pipelineId}] Following triggers were enabled: `,
      disabledGitTriggers,
      disabledCronTriggers,
    );

    await Promise.all([
      ...(disabledGitTriggersAnnotation
        ? [this.#httpClient.deleteAnntotation(
          pipelineId,
          'pipeline',
          DISABLED_GIT_TRIGGERS_KEY,
        )]
        : []),
      ...(disabledCronTriggersAnnotation
        ? [this.#httpClient.deleteAnntotation(
          pipelineId,
          'pipeline',
          DISABLED_CRON_TRIGGERS_KEY,
        )]
        : []),
    ]);

    disabledGitTriggersAnnotation && logger.log(
      `[Pipeline #${pipelineId}] "${DISABLED_GIT_TRIGGERS_KEY}" annotation was deleted from the pipeline`,
    );
    disabledCronTriggersAnnotation && logger.log(
      `[Pipeline #${pipelineId}] "${DISABLED_CRON_TRIGGERS_KEY}" annotation was deleted from the pipeline`,
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
        `[Pipeline #${pipelineId}] There are no previously deleted triggers, nothing to create`,
      );
      return;
    }

    const deletedTriggers: Trigger<true>[] = JSON.parse(
      new TextDecoder().decode(base64.decode(deletedTriggersAnnotation.value)),
    );
    logger.debug(
      `[Pipeline #${pipelineId}] Triggers to be created:`,
      deletedTriggers,
    );
    const deletedTriggersURIs = deletedTriggers.map((trigger) =>
      trigger['event-data'].uri
    );
    logger.log(
      `[Pipeline #${pipelineId}] Following triggers will be created: `,
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
      `[Pipeline #${pipelineId}] Following triggers were created: `,
      deletedTriggersURIs,
    );

    await this.#httpClient.deleteAnntotation(
      pipelineId,
      'pipeline',
      DELETED_TRIGGERS_KEY,
    );
    logger.log(
      `[Pipeline #${pipelineId}] "${DELETED_TRIGGERS_KEY}" annotation was deleted from the pipeline`,
    );
  }

  public async reenableTriggers(pipelineId: string): Promise<void> {
    const annotations = await this.#httpClient.getAnntotations(
      pipelineId,
      'pipeline',
    );

    await Promise.all([
      this.#enableSpecTriggers(pipelineId, annotations),
      this.#createTriggers(pipelineId, annotations),
    ]);
  }

  public async bulkProjectAction(
    projectId: string,
    action: keyof Pick<
      this,
      | 'disableSpecTriggersByPipeline'
      | 'deleteTriggersByPipeline'
      | 'reenableTriggers'
    >,
  ): Promise<void> {
    const pipelinesGenerator = this.#httpClient.getAllPipelinesGenerator({
      projectId,
      limit: 20,
    });

    for await (const pipelines of pipelinesGenerator) {
      await Promise.all(pipelines.docs.map((pipeline) => {
        return this[action](pipeline.metadata.id);
      }));
    }
  }
}
