import { COMMANDS } from './const.ts';

//  API

export interface GitTrigger {
  name: string;
  disabled: boolean;
}

export interface Pipeline {
  spec: { triggers: GitTrigger[] };
  metadata: { revision: number };
}

type EventType = 'cron';

interface EventData<WithEvent extends boolean> {
  description: WithEvent extends true ? string : undefined;
  status: WithEvent extends true ? string : undefined;
  help: WithEvent extends true ? string : undefined;
  uri: WithEvent extends true ? string : '';
  type: WithEvent extends true ? EventType : '';
  kind: WithEvent extends true ? string : '';
  account: WithEvent extends true ? string : '';
  secret: WithEvent extends true ? string : '';
}

export interface Trigger<WithEvent extends boolean> {
  event: string;
  pipeline: string;
  'event-data': EventData<WithEvent>;
}

export type EntityType = 'pipeline';

export interface Annotation {
  _id: string;
  accountId: string;
  entityId: string;
  key: string;
  value: any;
  type: any;
  entityType: EntityType;
}

//  Internal

export type Command = typeof COMMANDS[number];

export interface Flags {
  token: string;
  pipelineId: string;
  terminateBuilds: boolean;
  deleteTriggers: boolean;
  host: string;
  interactive?: boolean;
}

export interface CLIArguments {
  command: Command;
  flags: Flags;
}

export interface CodefreshCLIConfigContext {
  type: string;
  name: string;
  url: string;
  token: string;
  beta: boolean;
  onPrem: boolean;
}

export interface CodefreshCLIConfig {
  contexts: Record<string, CodefreshCLIConfigContext>;
  'current-context': string;
}
