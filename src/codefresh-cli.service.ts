import { CodefreshCLIConfig, CodefreshCLIConfigContext } from './types.ts';

export class CodefreshCLIService {
  #config: CodefreshCLIConfig;

  constructor(config: CodefreshCLIConfig) {
    this.#config = config;
  }

  public getCurrentContext(): string {
    return this.#config['current-context'];
  }

  public getContextByName(
    contextName: string,
  ): CodefreshCLIConfigContext | null {
    return this.#config.contexts[contextName] ?? null;
  }
}
