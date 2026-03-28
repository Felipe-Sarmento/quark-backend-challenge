import { randomUUID } from 'crypto';

export class Entity {
  private readonly _id: string;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(data?: { id?: string; createdAt?: Date; updatedAt?: Date }) {
    const now = new Date();
    this._id = data?.id ?? randomUUID();
    this._createdAt = data?.createdAt ?? now;
    this._updatedAt = data?.updatedAt ?? now;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
