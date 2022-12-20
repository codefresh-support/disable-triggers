import { NotFoundError } from './errors.ts';
import type { Annotation, EntityType, Pipeline, Trigger } from './types.ts';

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

  public async createTriggerForPipeline(
    event: string,
    pipelineId: string,
  ): Promise<void> {
    const encodedEvent = encodeURIComponent(encodeURIComponent(event));
    const url = new URL(
      `api/hermes/triggers/${encodedEvent}/${pipelineId}`,
      this.#baseUrl,
    );
    const response = await fetch(url, {
      method: 'POST',
      headers: this.#headers,
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
      throw new NotFoundError(
        `Entity #${entityId} was not found or has no annotations`,
      );
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
