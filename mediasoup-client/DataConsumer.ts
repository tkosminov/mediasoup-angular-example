// tslint:disable: no-any
// tslint:disable: jsdoc-format
// tslint:disable: no-redundant-jsdoc

export interface IDataConsumer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits open
   * @emits {Object} error
   * @emits close
   * @emits {Any} message
   * @emits @close
   */
  new ({
    id,
    dataProducerId,
    dataChannel,
    sctpStreamParameters,
    appData,
  }: {
    id: string;
    dataProducerId: string;
    dataChannel: RTCDataChannel;
    sctpStreamParameters: any;
    appData: object;
  });

  /**
   * DataConsumer id.
   *
   * @returns {String}
   */
  id: string;

  /**
   * Associated DataProducer id.
   *
   * @returns {String}
   */
  dataProducerId: string;

  /**
   * Whether the DataConsumer is closed.
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
   * DataChannel binaryType.
   *
   * @returns {String}
   */
  binaryType: string;

  /**
   * App custom data.
   *
   * @returns {Object}
   */
  appData: object;

  /**
   * Closes the DataConsumer.
   */
  close(): void;

  // /**
  //  * Transport was closed.
  //  *
  //  * @private
  //  */
  // transportClosed(): void;
}
