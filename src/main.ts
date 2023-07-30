import { CodefreshHttpClient } from './codefresh.http-client.ts';
import { logger } from './logger.service.ts';
import { parseFlags } from './parse-flags.ts';
import { PipelineService } from './pipeline.service.ts';

try {
  const {
    command,
    flags,
  } = await parseFlags(Deno.args);

  const service = new PipelineService(
    new CodefreshHttpClient(flags.token, flags.host),
  );

  if (command === 'disable') {
    if (flags.terminateBuilds) {
      logger.warn(
        '⚠️ Active builds termination currently not implemented and will be skipped.',
      );
      // TODO: terminate all active builds for given pipeline
    }

    await Promise.all([
      ...(flags.pipelineId
        ? [
          service.disableGitTriggersByPipeline(flags.pipelineId),
          ...(flags.deleteTriggers
            ? [service.deleteTriggersByPipeline(flags.pipelineId)]
            : []),
        ]
        : []),
      ...(flags.projectId
        ? [
          service.bulkProjectAction(
            flags.projectId,
            'disableGitTriggersByPipeline',
          ),
          ...(flags.deleteTriggers
            ? [
              service.bulkProjectAction(
                flags.projectId,
                'deleteTriggersByPipeline',
              ),
            ]
            : []),
        ]
        : []),
    ]);
  }

  if (command === 'enable') {
    await (flags.pipelineId !== undefined
      ? service.reenableTriggers(flags.pipelineId)
      : service.bulkProjectAction(flags.projectId, 'reenableTriggers'));
  }
} catch (error) {
  logger.error(`❌ ${error.name}: ${error.message}`);
  Deno.exit(1);
}
