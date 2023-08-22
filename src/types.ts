import { COMMANDS } from './const.ts';

//  API

interface SpecTrigger {
  name: string;
  disabled: boolean;
  id: string;
}

export interface GitTrigger extends SpecTrigger {
  type: 'git';
}

export interface CronTrigger extends SpecTrigger {
  type: 'cron';
}

export interface Pipeline {
  spec: {
    triggers: GitTrigger[];
    cronTriggers?: CronTrigger[];
  };
  metadata: {
    id: string;
    name: string;
    revision: number;
  };
}

type EventType = 'cron' | 'registry' | 'helm';

interface Filters {
  tag: string;
}

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
  filters?: Filters;
  'event-data': EventData<WithEvent>;
}

export type EntityType = 'pipeline';

export interface Annotation {
  _id: string;
  accountId: string;
  entityId: string;
  key: string;
  // deno-lint-ignore no-explicit-any
  value: any;
  // deno-lint-ignore no-explicit-any
  type: any;
  entityType: EntityType;
}

export interface GetPipelinesParams {
  offset?: number;
  id?: number;
  limit?: number;
  labels?: string;
  projectId?: string;
  executionContextId?: string;
  executionContextName?: string;
}

export interface Pipelines {
  docs: Pipeline[];
  count: number;
}

export interface Build {
  id: string;
}

export interface Pagination {
  sessionId: string | null;
  page: number;
  pageSize: number;
  firstId: string | null;
  lastId: string | null;
  nextPage: boolean;
  prevPage: boolean;
}

export interface Builds {
  workflows: { docs: Build[] };
  pagination: Pagination;
}

export interface GetBuildsParams {
  limit?: number;
  page?: number;
  status?: string;
  pipeline?: string;
}

//  Internal

export type Command = typeof COMMANDS[number];

interface BaseFlags {
  token: string;
  terminateBuilds: boolean;
  deleteTriggers: boolean;
  host: string;
  interactive?: boolean;
}

interface FlagsWithPipelineId extends BaseFlags {
  pipelineId: string;
  projectId?: never;
}

interface FlagsWithProjectId extends BaseFlags {
  pipelineId?: never;
  projectId: string;
}

export type Flags = FlagsWithPipelineId | FlagsWithProjectId;

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
