import { ITransport } from './Transport';

// tslint:disable: no-any
// tslint:disable: jsdoc-format
// tslint:disable: no-redundant-jsdoc

export interface IDevice {
  /**
   * Create a new Device to connect to mediasoup server.
   *
   * @param {Class|String} [Handler] - An optional RTC handler class for unsupported or
   *   custom devices (not needed when running in a browser). If a String, it will
   *   force usage of the given built-in handler.
   *
   * @throws {UnsupportedError} if device is not supported.
   */
  new ({ Handler }: { Handler?: any });

  /**
   * Whether the Device is loaded.
   *
   * @returns {Boolean}
   */
  loaded: boolean;

  /**
   * The RTC handler class name ('Chrome70', 'Firefox65', etc).
   *
   * @returns {RTCRtpCapabilities}
   */
  handlerName: RTCRtpCapabilities;

  /**
   * RTP capabilities of the Device for receiving media.
   *
   * @returns {RTCRtpCapabilities}
   * @throws {InvalidStateError} if not loaded.
   */
  rtpCapabilities: string;

  /**
   * SCTP capabilities of the Device.
   *
   * @returns {Object}
   * @throws {InvalidStateError} if not loaded.
   */
  sctpCapabilities: object;

  /**
   * Initialize the Device.
   *
   * @param {RTCRtpCapabilities} routerRtpCapabilities - Router RTP capabilities.
   *
   * @async
   * @throws {TypeError} if missing/wrong arguments.
   * @throws {InvalidStateError} if already loaded.
   * @param {routerRtpCapabilities}
   */
  load({ routerRtpCapabilities }: { routerRtpCapabilities: RTCRtpCapabilities }): Promise<void>;

  /**
   * Whether we can produce audio/video.
   *
   * @param {String} kind - 'audio' or 'video'.
   *
   * @returns {Boolean}
   * @throws {InvalidStateError} if not loaded.
   * @throws {TypeError} if wrong arguments.
   */
  canProduce(kind: string): boolean;

  /**
   * Creates a Transport for sending media.
   *
   * @param {String} - Server-side Transport id.
   * @param {RTCIceParameters} iceParameters - Server-side Transport ICE parameters.
   * @param {Array<RTCIceCandidate>} [iceCandidates] - Server-side Transport ICE candidates.
   * @param {RTCDtlsParameters} dtlsParameters - Server-side Transport DTLS parameters.
   * @param {Object} [sctpParameters] - Server-side SCTP parameters.
   * @param {Array<RTCIceServer>} [iceServers] - Array of ICE servers.
   * @param {RTCIceTransportPolicy} [iceTransportPolicy] - ICE transport
   *   policy.
   * @param {Object} [proprietaryConstraints] - RTCPeerConnection proprietary constraints.
   * @param {Object} [appData={}] - Custom app data.
   *
   * @returns {Transport}
   * @throws {InvalidStateError} if not loaded.
   * @throws {TypeError} if wrong arguments.
   */
  createSendTransport({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
    sctpParameters,
    iceServers,
    iceTransportPolicy,
    proprietaryConstraints,
    appData,
  }: {
    id: string;
    iceParameters: RTCIceParameters;
    iceCandidates: RTCIceCandidate[];
    dtlsParameters: RTCDtlsParameters;
    sctpParameters?: object;
    iceServers?: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    proprietaryConstraints?: object;
    appData?: object;
  }): ITransport;

  /**
   * Creates a Transport for receiving media.
   *
   * @param {String} - Server-side Transport id.
   * @param {RTCIceParameters} iceParameters - Server-side Transport ICE parameters.
   * @param {Array<RTCIceCandidate>} [iceCandidates] - Server-side Transport ICE candidates.
   * @param {RTCDtlsParameters} dtlsParameters - Server-side Transport DTLS parameters.
   * @param {Object} [sctpParameters] - Server-side SCTP parameters.
   * @param {Array<RTCIceServer>} [iceServers] - Array of ICE servers.
   * @param {RTCIceTransportPolicy} [iceTransportPolicy] - ICE transport
   *   policy.
   * @param {Object} [proprietaryConstraints] - RTCPeerConnection proprietary constraints.
   * @param {Object} [appData={}] - Custom app data.
   *
   * @returns {Transport}
   * @throws {InvalidStateError} if not loaded.
   * @throws {TypeError} if wrong arguments.
   */
  createRecvTransport({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
    sctpParameters,
    iceServers,
    iceTransportPolicy,
    proprietaryConstraints,
    appData,
  }: {
    id: string;
    iceParameters: RTCIceParameters;
    iceCandidates: RTCIceCandidate[];
    dtlsParameters: RTCDtlsParameters;
    sctpParameters?: object;
    iceServers?: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    proprietaryConstraints?: object;
    appData?: object;
  }): ITransport;
}
