// tslint:disable: jsdoc-format
// tslint:disable: no-any
// tslint:disable: no-redundant-jsdoc

export interface ICommandQueue {
  new ();

  close(): void;

  /**
   * @param {Function} command - Function that returns a promise.
   *
   * @async
   */
  push(command: () => void): /* CommandQueue.prototype.+Promise */ Promise<void>;
}
