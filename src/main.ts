import { CodefreshHttpClient } from './codefresh.http-client.ts';
import { PipelineService } from './pipeline.service.ts';
import { parseFlags } from './parse-flags.ts';
import { logger } from './logger.service.ts';

try {
  const {
    command,
    flags: { token, host, pipelineId, terminateBuilds, deleteTriggers },
  } = await parseFlags(Deno.args);

  const service = new PipelineService(new CodefreshHttpClient(token, host));

  if (command === 'disable') {
    if (terminateBuilds) {
      logger.warn(
        '⚠️ Active builds termination currently not implemented and will be skipped.',
      );
      // TODO: terminate all active builds for given pipeline
    }

    if (deleteTriggers) {
      await Promise.all([
        service.disableGitTriggers(pipelineId),
        service.deleteTriggers(pipelineId),
      ]);
    } else {
      await service.disableGitTriggers(pipelineId);
    }
  }

  if (command === 'enable') {
    await service.reenableTriggers(pipelineId);
  }
} catch (error) {
  logger.error(`❌ ${error.name}: ${error.message}`);
  Deno.exit(1);
}
