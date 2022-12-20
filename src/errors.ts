export class NotFoundError extends Error {
  constructor(...params: ConstructorParameters<typeof Error>) {
    super(...params);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends Error {
  constructor(...params: ConstructorParameters<typeof Error>) {
    super(...params);
    this.name = this.constructor.name;
  }
}
