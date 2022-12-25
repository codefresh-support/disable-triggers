import { parseDenoFlags } from './deps.ts';
import { BASE_URL, COMMANDS } from './const.ts';
import { CodefreshCLIService } from './codefresh-cli.service.ts';
import { ValidationError } from './errors.ts';
import type { CLIArguments, Command } from './types.ts';
import { loadCLIConfig } from './load-cli-config.ts';

const isKnownCommand = (
  command: string,
): command is Command => {
  return COMMANDS.includes(<any> command);
};

export const parseFlags = async (
  args: typeof Deno['args'],
): Promise<CLIArguments> => {
  const [command, ...flags] = args;

  if (!isKnownCommand(command)) {
    throw new ValidationError(
      `Unknown command: "${command}". Please use one of these: ${
        COMMANDS.join(', ')
      }.`,
    );
  }

  const parsedFlags = parseDenoFlags(flags, {
    string: ['pipeline-id', 'token', 'host', 'cfconfig', 'cfconfig-context'],
    boolean: ['terminate-builds', 'delete-triggers', 'use-cfconfig'],
    default: {
      'terminate-builds': false,
      'delete-triggers': false,
      'host': BASE_URL,
      'use-cfconfig': false,
    },
  });

  if (parsedFlags['use-cfconfig']) {
    console.log(
      '📃 "--use-cfconfig" was enabled. "--token" and "--host" will be ignored even if passed',
    );
    const cliService = new CodefreshCLIService(
      await loadCLIConfig(parsedFlags['cfconfig']),
    );
    const targetContextName = parsedFlags['cfconfig-context'] ||
      cliService.getCurrentContext();
    parsedFlags['cfconfig-context'] ||
      console.log(`⚠️ "--cfconfig-context" was not set, using current context`);
    const targetContext = cliService.getContextByName(targetContextName);
    if (!targetContext) {
      throw new ValidationError(
        `Context ${targetContextName} was not found in CLI config`,
      );
    }
    console.log(
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

  if (!parsedFlags['pipeline-id']) {
    throw new ValidationError(
      'Pipeline ID was not defined. Please use "--pipeline-id" flag',
    );
  }

  return {
    command,
    flags: {
      pipelineId: parsedFlags['pipeline-id'],
      token: parsedFlags['token'],
      terminateBuilds: parsedFlags['terminate-builds'],
      deleteTriggers: parsedFlags['delete-triggers'],
      host: parsedFlags['host'],
    },
  };
};
