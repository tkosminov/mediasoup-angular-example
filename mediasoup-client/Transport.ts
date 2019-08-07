import { IConsumer } from './Consumer';
import { IDataConsumer } from './DataConsumer';
import { IDataProducer } from './DataProducer';
import { IProducer } from './Producer';

// tslint:disable: no-any
// tslint:disable: jsdoc-format
// tslint:disable: no-redundant-jsdoc

export interface ITransport {
  /**
   * @private
   *
   * @emits {transportLocalParameters: Object, callback: Function, errback: Function} connect
   * @emits {connectionState: String} connectionstatechange
   * @emits {producerLocalParameters: Object, callback: Function, errback: Function} produce
   * @emits {dataProducerLocalParameters: Object, callback: Function, errback: Function} producedata
   */
  new ({
    direction,
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
    sctpParameters,
    iceServers,
    iceTransportPolicy,
    proprietaryConstraints,
    appData,
    Handler,
    extendedRtpCapabilities,
    canProduceByKind,
  }: {
    direction: string;
    id: string;
    iceParameters: RTCIceParameters;
    iceCandidates: RTCIceCandidate[];
    dtlsParameters: RTCDtlsParameters;
    sctpParameters: any;
    iceServers: RTCIceServer[];
    iceTransportPolicy: RTCIceTransportPolicy;
    proprietaryConstraints: object;
    appData?: object;
    Handler: any;
    extendedRtpCapabilities: object;
    canProduceByKind: object;
  });

  /**
   * Transport id.
   *
   * @returns {String}
   */
  id: string;

  /**
   * Whether the Transport is closed.
   *
   * @returns {Boolean}
   */
  closed: boolean;

  /**
   * Transport direction.
   *
   * @returns {String}
   */
  direction: string;

  /**
   * RTC handler instance.
   *
   * @returns {Handler}
   */
  handler: any;

  /**
   * Connection state.
   *
   * @returns {String}
   */
  connectionState: string;

  /**
   * App custom data.
   *
   * @returns {Object}
   */
  appData: object;

  on(type: any, listener: (...params: any) => Promise<void> | void): Promise<void> | void;

  /**
   * Close the Transport.
   */
  close(): void;

  /**
   * Get associated Transport (RTCPeerConnection) stats.
   *
   * @async
   * @returns {RTCStatsReport}
   * @throws {InvalidStateError} if Transport closed.
   */
  getStats(): Promise<RTCStatsReport>;

  /**
   * Restart ICE connection.
   *
   * @param {RTCIceParameters} iceParameters - New Server-side Transport ICE parameters.
   *
   * @async
   * @throws {InvalidStateError} if Transport closed.
   * @throws {TypeError} if wrong arguments.
   */
  restartIce({ iceParameters }: { iceParameters: RTCIceParameters }): Promise<void>;

  /**
   * Update ICE servers.
   *
   * @param {Array<RTCIceServer>} [iceServers] - Array of ICE servers.
   *
   * @async
   * @throws {InvalidStateError} if Transport closed.
   * @throws {TypeError} if wrong arguments.
   */
  updateIceServers({ iceServers }: { iceServers: RTCIceServer[] }): Promise<void>;

  /**
   * Create a Producer.
   *
   * @param {MediaStreamTrack} track - Track to sent.
   * @param {Array<RTCRtpCodingParameters>} [encodings] - Encodings.
   * @param {Object} [codecOptions] - Codec options.
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {Producer}
   * @throws {InvalidStateError} if Transport closed or track ended.
   * @throws {TypeError} if wrong arguments.
   * @throws {UnsupportedError} if Transport direction is incompatible or
   *   cannot produce the given media kind.
   */
  produce({
    track,
    encodings,
    codecOptions,
    appData,
  }: {
    track: MediaStreamTrack;
    encodings?: RTCRtpCodingParameters[];
    codecOptions?: object;
    appData?: object;
  }): Promise<IProducer>;

  /**
   * Create a Consumer to consume a remote Producer.
   *
   * @param {String} id - Server-side Consumer id.
   * @param {String} producerId - Server-side Producer id.
   * @param {String} kind - 'audio' or 'video'.
   * @param {RTCRtpParameters} rtpParameters - Server-side Consumer RTP parameters.
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {Consumer}
   * @throws {InvalidStateError} if Transport closed.
   * @throws {TypeError} if wrong arguments.
   * @throws {UnsupportedError} if Transport direction is incompatible.
   */
  consume({
    id,
    producerId,
    kind,
    rtpParameters,
    appData,
  }: {
    id: string;
    producerId: string;
    kind: string;
    rtpParameters: RTCRtpParameters;
    appData?: object;
  }): Promise<IConsumer>;

  /**
   * Create a DataProducer
   *
   * @param {Boolean} [ordered=true]
   * @param {Number} [maxPacketLifeTime]
   * @param {Number} [maxRetransmits]
   * @param {String} [priority='low'] // 'very-low' / 'low' / 'medium' / 'high'
   * @param {String} [label='']
   * @param {String} [protocol='']
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {DataProducer}
   * @throws {InvalidStateError} if Transport closed.
   * @throws {TypeError} if wrong arguments.
   * @throws {UnsupportedError} if Transport direction is incompatible or remote
   *   transport does not enable SCTP.
   */
  produceData({
    ordered,
    maxPacketLifeTime,
    maxRetransmits,
    priority,
    label,
    protocol,
    appData,
  }: {
    ordered?: boolean;
    maxPacketLifeTime: number;
    maxRetransmits: number;
    priority?: 'very-low' | 'low' | 'medium' | 'high';
    label?: string;
    protocol?: string;
    appData?: object;
  }): Promise<IDataProducer>;

  /**
   * Create a DataConsumer
   *
   * @param {String} id - Server-side DataConsumer id.
   * @param {String} dataProducerId - Server-side DataProducer id.
   * @param {RTCSctpStreamParameters} sctpStreamParameters - Server-side DataConsumer
   *   SCTP parameters.
   * @param {String} [label='']
   * @param {String} [protocol='']
   * @param {Object} [appData={}] - Custom app data.
   *
   * @async
   * @returns {DataConsumer}
   * @throws {InvalidStateError} if Transport closed.
   * @throws {TypeError} if wrong arguments.
   * @throws {UnsupportedError} if Transport direction is incompatible or remote
   *   transport does not enable SCTP.
   */
  consumeData({
    id,
    dataProducerId,
    sctpStreamParameters,
    label,
    protocol,
    appData,
  }: {
    id: string;
    dataProducerId: string;
    sctpStreamParameters: any;
    label?: string;
    protocol?: string;
    appData?: object;
  }): Promise<IDataConsumer>;

  /**
   *
   */
  _handleHandler(): void;

  /**
   *
   * @param producer
   */
  _handleProducer(producer: IProducer): void;
  /**
   *
   * @param consumer
   */
  _handleConsumer(consumer: IConsumer): void;
  /**
   *
   * @param dataProducer
   */
  _handleDataProducer(dataProducer: IDataProducer): void;
  /**
   *
   * @param dataConsumer
   */
  _handleDataConsumer(dataConsumer: IDataConsumer): void;
}
