import { parse } from 'https://deno.land/std@0.167.0/flags/mod.ts';
import { BASE_URL, COMMANDS } from './const.ts';
import { ValidationError } from './errors.ts';
import type { CLIArguments, Command } from './types.ts';

const isKnownCommand = (
  command: string,
): command is Command => {
  return COMMANDS.includes(<any> command);
};

export const parseFlags = (args: typeof Deno['args']): CLIArguments => {
  const [command, ...flags] = args;

  if (!isKnownCommand(command)) {
    throw new ValidationError(
      `❗ Unknown command: "${command}". Please use one of these: ${
        COMMANDS.join(', ')
      }.`,
    );
  }

  const parsedFlags = parse(flags, {
    string: ['pipeline-id', 'token', 'host'],
    boolean: ['terminate-builds', 'delete-triggers'],
    default: {
      'terminate-builds': false,
      'delete-triggers': false,
      'host': BASE_URL,
    },
  });

  if (!parsedFlags.token) {
    throw new ValidationError(
      '❗ Token was not defined. Please use "--token" flag',
    );
  }

  if (!parsedFlags['pipeline-id']) {
    throw new ValidationError(
      '❗ Pipeline ID was not defined. Please use "--pipeline-id" flag',
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
