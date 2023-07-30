import { CodefreshCLIService } from './codefresh-cli.service.ts';
import { BASE_URL, COMMANDS } from './const.ts';
import { parseDenoFlags } from './deps.ts';
import { ValidationError } from './errors.ts';
import { loadCLIConfig } from './load-cli-config.ts';
import { logger } from './logger.service.ts';

import type { CLIArguments, Command, Flags } from './types.ts';

const isKnownCommand = (
  command: string,
): command is Command => {
  // deno-lint-ignore no-explicit-any
  return COMMANDS.includes(<any> command);
};

export const parseFlags = async (
  args: typeof Deno['args'],
): Promise<CLIArguments> => {
  const [command, ...flags] = args;

  if (!command) {
    throw new ValidationError(
      `Command has not been passed. Please use one of these: ${
        COMMANDS.join(', ')
      }.`,
    );
  }

  if (!isKnownCommand(command)) {
    throw new ValidationError(
      `Unknown command: "${command}". Please use one of these: ${
        COMMANDS.join(', ')
      }.`,
    );
  }

  const parsedFlags = parseDenoFlags(flags, {
    string: [
      'pipeline-id',
      'project-id',
      'token',
      'host',
      'cfconfig',
      'cfconfig-context',
    ],
    boolean: ['terminate-builds', 'delete-triggers', 'use-cfconfig'],
    default: {
      'terminate-builds': false,
      'delete-triggers': false,
      'host': BASE_URL,
      'use-cfconfig': false,
    },
  });

  if (parsedFlags['use-cfconfig']) {
    logger.log(
      '📃 "--use-cfconfig" was enabled. "--token" and "--host" will be ignored even if passed',
    );
    const cliService = new CodefreshCLIService(
      await loadCLIConfig(parsedFlags['cfconfig']),
    );
    const targetContextName = parsedFlags['cfconfig-context'] ||
      cliService.getCurrentContext();
    parsedFlags['cfconfig-context'] ||
      logger.log(`⚠️ "--cfconfig-context" was not set, using current context`);
    const targetContext = cliService.getContextByName(targetContextName);
    if (!targetContext) {
      throw new ValidationError(
        `Context ${targetContextName} was not found in CLI config`,
      );
    }
    logger.log(
      `✅ Context "${targetContextName}" was loaded. Host: "${targetContext.url}"`,
    );
    parsedFlags['token'] = targetContext.token;
    parsedFlags['host'] = targetContext.url;
  }

  if (!parsedFlags.token) {
    throw new ValidationError(
      'Token was not defined. Please use "--token" or "--use-cfconfig" flag',
    );
  }

  if (!parsedFlags['pipeline-id'] && !parsedFlags['project-id']) {
    throw new ValidationError(
      'Neither Pipeline ID nor Project ID has been defined. Please use "--pipeline-id" or "--project-id" flag',
    );
  }

  if (parsedFlags['pipeline-id'] && parsedFlags['project-id']) {
    throw new ValidationError(
      'Both Pipeline ID and Project ID have been defined. Please choose "--pipeline-id" or "--project-id" flag',
    );
  }

  return {
    command,
    flags: {
      pipelineId: parsedFlags['pipeline-id'],
      projectId: parsedFlags['project-id'],
      token: parsedFlags['token'],
      terminateBuilds: parsedFlags['terminate-builds'],
      deleteTriggers: parsedFlags['delete-triggers'],
      host: parsedFlags['host'],
    } as Flags,
  };
};
