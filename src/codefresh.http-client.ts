import { NotFoundError } from './errors.ts';

import type {
  Annotation,
  EntityType,
  GetPipelinesParams,
  Pipeline,
  Pipelines,
  Trigger,
} from './types.ts';

export class CodefreshHttpClient {
  #baseUrl: string;
  #token: string;
  #headers: RequestInit['headers'];

  constructor(token: string, baseUrl: string) {
    this.#token = token;
    this.#baseUrl = baseUrl;
    this.#headers = {
      'Content-Type': 'application/json',
      'Authorization': this.#token,
    };
  }

  #handleErrors(response: Response): never {
    switch (response.status) {
      default:
        throw new Error(
          `Server response: ${response.status}: $${response.statusText}`,
        );
    }
  }

  public async getPipeline(id: string): Promise<Pipeline> {
    const url = new URL(`api/pipelines/${id}`, this.#baseUrl);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.#headers,
    });

    if (response.status === 404) {
      throw new NotFoundError(`Pipeline #${id} was not found`);
    }

    return response.ok ? response.json() : this.#handleErrors(response);
  }

  public async getPipelines(params: GetPipelinesParams): Promise<Pipelines> {
    const url = new URL('api/pipelines', this.#baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.#headers,
    });

    return response.ok ? response.json() : this.#handleErrors(response);
  }

  public async *getAllPipelinesGenerator(
    params: GetPipelinesParams,
  ): AsyncGenerator<Pipelines> {
    const limit = params.limit ?? 10;
    let offset = params.offset ?? 0;
    let done = false;

    while (!done) {
      const response = await this.getPipelines({
        ...params,
        offset: offset,
        limit: limit,
      });
      offset += limit === 0 ? response.docs.length : limit;
      done = offset >= response.count;
      yield response;
    }
  }

  public async replacePipeline(
    id: string,
    pipeline: Pipeline,
  ): Promise<Pipeline> {
    const url = new URL(`api/pipelines/${id}`, this.#baseUrl);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.#headers,
      body: JSON.stringify(pipeline),
    });

    if (response.status === 404) {
      throw new NotFoundError(`Pipeline #${id} was not found`);
    }

    return response.ok ? response.json() : this.#handleErrors(response);
  }

  public async getPipelineTriggers<WithEvent extends boolean>(
    id: string,
    withEvent: WithEvent,
  ): Promise<Trigger<WithEvent>[] | null> {
    const url = new URL(`api/hermes/triggers/pipeline/${id}`, this.#baseUrl);
    url.searchParams.set('with-event', String(withEvent));
    const response = await fetch(url, {
      method: 'GET',
      headers: this.#headers,
    });

    return response.ok ? response.json() : this.#handleErrors(response);
  }

  public async deleteTriggerFromPipeline(
    event: string,
    pipelineId: string,
  ): Promise<void> {
    const encodedEvent = encodeURIComponent(encodeURIComponent(event));
    const url = new URL(
      `api/hermes/triggers/${encodedEvent}/${pipelineId}`,
      this.#baseUrl,
    );
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.#headers,
    });

    return response.ok ? undefined : this.#handleErrors(response);
  }

  public async createTriggerForPipeline<WithEvent extends boolean>(
    event: string,
    pipelineId: string,
    data?: Trigger<WithEvent>,
  ): Promise<void> {
    const encodedEvent = encodeURIComponent(encodeURIComponent(event)); // Don't ask me why, but it's really needed to be done twice
    const url = new URL(
      `api/hermes/triggers/${encodedEvent}/${pipelineId}`,
      this.#baseUrl,
    );
    const response = await fetch(url, {
      method: 'POST',
      headers: this.#headers,
      ...data && { body: JSON.stringify(data) },
    });

    if (response.status === 404) {
      throw new NotFoundError(`Event "${event}" was not found`);
    }

    return response.ok ? undefined : this.#handleErrors(response);
  }

  public async getAnntotations(
    entityId: string,
    entityType: EntityType,
  ): Promise<Annotation[]> {
    const url = new URL(
      `api/annotations`,
      this.#baseUrl,
    );
    url.searchParams.set('entityId', entityId);
    url.searchParams.set('entityType', entityType);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.#headers,
    });

    if (response.status === 404) {
      return [];
    }

    return response.ok ? response.json() : this.#handleErrors(response);
  }

  public async createAnntotation(
    entityId: string,
    entityType: EntityType,
    key: string,
    value: any,
  ): Promise<Annotation | false> {
    const url = new URL(
      `api/annotations`,
      this.#baseUrl,
    );
    const response = await fetch(url, {
      method: 'POST',
      headers: this.#headers,
      body: JSON.stringify({
        entityId,
        entityType,
        key,
        value,
      }),
    });

    return response.ok ? response.json() : this.#handleErrors(response);
  }

  public async deleteAnntotation(
    entityId: string,
    entityType: EntityType,
    key: string,
  ): Promise<any> {
    const url = new URL(
      `api/annotations`,
      this.#baseUrl,
    );
    url.searchParams.set('entityId', entityId);
    url.searchParams.set('entityType', entityType);
    url.searchParams.set('key', key);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.#headers,
    });

    if (response.status === 404) {
      throw new NotFoundError(`Entity #${entityId} was not found`);
    }

    return response.ok ? response.json() : this.#handleErrors(response);
  }
}
