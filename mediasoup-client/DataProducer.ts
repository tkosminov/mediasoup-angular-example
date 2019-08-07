// tslint:disable: no-any
// tslint:disable: jsdoc-format
// tslint:disable: no-redundant-jsdoc

export interface IDataProducer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits open
   * @emits {Object} error
   * @emits close
   * @emits bufferedamountlow
   * @emits @close
   */
  new ({
    id,
    dataChannel,
    sctpStreamParameters,
    appData,
  }: {
    id: string;
    dataChannel: RTCDataChannel;
    sctpStreamParameters: any;
    appData: object;
  });

  /**
   * DataProducer id.
   *
   * @returns {String}
   */
  id: string;

  /**
   * Whether the DataProducer is closed.
   *
   * @returns {Boolean}
   */
  closed: boolean;

  /**
   * SCTP stream parameters.
   *
   * @returns {RTCSctpStreamParameters}
   */
  sctpStreamParameters: any;

  /**
   * DataChannel readyState.
   *
   * @returns {String}
   */
  readyState: string;

  /**
   * DataChannel label.
   *
   * @returns {String}
   */
  label: string;

  /**
   * DataChannel protocol.
   *
   * @returns {String}
   */
  protocol: string;

  /**
   * DataChannel bufferedAmount.
   *
   * @returns {String}
   */
  bufferedAmount: string;

  /**
   * DataChannel bufferedAmountLowThreshold.
   *
   * @returns {String}
   */
  bufferedAmountLowThreshold: string;

  /**
   * App custom data.
   *
   * @returns {Object}
   */
  appData: object;

  /**
   * Closes the DataProducer.
   */
  close(): void;

  /**
   * Send a message.
   *
   * @param {String|Blob|ArrayBuffer|ArrayBufferView} data.
   *
   * @throws {InvalidStateError} if DataProducer closed.
   * @throws {TypeError} if wrong arguments.
   * @param data
   */
  send(data: string | Blob | ArrayBuffer | ArrayBufferView): void;

  // /**
  //  * Transport was closed.
  //  *
  //  * @private
  //  */
  // transportClosed(): void;
}
