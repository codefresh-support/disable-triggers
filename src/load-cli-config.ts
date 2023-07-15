import { loadYaml, resolvePath } from './deps.ts';
import { NotFoundError, ValidationError } from './errors.ts';
import { logger } from './logger.service.ts';
import type { CodefreshCLIConfig } from './types.ts';

export const loadCLIConfig = async (
  path?: string,
): Promise<CodefreshCLIConfig> => {
  try {
    if (!path) {
      logger.log('📃 Path to CLI config was not set. Using default path');
      const HOME = Deno.env.get(
        Deno.build.os === 'windows' ? 'USERPROFILE' : 'HOME',
      );
      if (!HOME) {
        throw new Error(
          '❌ Unable to resolve path to HOME in order to load default CLI config',
        );
      }
      path = resolvePath(HOME, '.cfconfig');
    }
    logger.log(`📃 Loading CLI config from "${path}"`);
    const config = await Deno.readTextFile(path);
    const parsedConfig = <CodefreshCLIConfig> loadYaml(config);
    if (
      typeof parsedConfig === 'object' && parsedConfig !== null &&
      Reflect.has(parsedConfig, 'current-context') &&
      parsedConfig['current-context'] &&
      Reflect.has(parsedConfig, 'contexts') &&
      typeof parsedConfig.contexts === 'object' &&
      parsedConfig.contexts !== null
    ) {
      logger.log('✅ CLI config was successfully loaded');
      return parsedConfig;
    }
    throw new ValidationError('Invalid CLI config');
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new NotFoundError(`CLI config was not found at "${path}"`);
    }
    throw error;
  }
};
