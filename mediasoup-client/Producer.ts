// tslint:disable: no-any
// tslint:disable: jsdoc-format
// tslint:disable: no-redundant-jsdoc

export interface IProducer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits trackended
   * @emits {track: MediaStreamTrack} @replacetrack
   * @emits {spatialLayer: String} @setmaxspatiallayer
   * @emits @getstats
   * @emits @close
   */
  new ({
    id,
    localId,
    track,
    rtpParameters,
    appData,
  }: {
    id: string;
    localId: string;
    track: MediaStreamTrack;
    rtpParameters: RTCRtpParameters;
    appData?: object;
  });

  /**
   * Producer id.
   *
   * @returns {String}
   */
  id: string;

  /**
   * Local id.
   *
   * @private
   * @returns {String}
   */
  localId: string;

  /**
   * Whether the Producer is closed.
   *
   * @returns {Boolean}
   */
  closed: boolean;

  /**
   * Media kind.
   *
   * @returns {String}
   */
  kind: 'audio' | 'video';

  /**
   * The associated track.
   *
   * @returns {MediaStreamTrack}
   */
  track: MediaStreamTrack;

  /**
   * RTP parameters.
   *
   * @returns {RTCRtpParameters}
   */
  rtpParameters: RTCRtpParameters;

  /**
   * Whether the Producer is paused.
   *
   * @returns {Boolean}
   */
  paused: boolean;

  /**
   * Max spatial layer.
   *
   * @type {Number}
   */
  maxSpatialLayer: number;

  /**
   * App custom data.
   *
   * @type {Object}
   */
  appData: object;

  on(type: any, listener: (...params: any) => Promise<void> | void): Promise<void> | void;

  /**
   * Closes the Producer.
   */
  close(): void;

  // /**
  //  * Transport was closed.
  //  *
  //  * @private
  //  */
  // transportClosed();

  /**
   * Get associated RTCRtpSender stats.
   *
   * @promise
   * @returns {RTCStatsReport}
   * @throws {InvalidStateError} if Producer closed.
   */
  getStats(): Promise<RTCStatsReport>;

  /**
   * Pauses sending media.
   */
  pause(): void;

  /**
   * Resumes sending media.
   */
  resume(): void;

  /**
   * Replaces the current track with a new one.
   *
   * @param {MediaStreamTrack} track - New track.
   *
   * @async
   * @throws {InvalidStateError} if Producer closed or track ended.
   * @throws {TypeError} if wrong arguments.
   */
  replaceTrack({ track }: { track: MediaStreamTrack }): Promise<void>;

  /**
   * Sets the video max spatial layer to be sent.
   *
   * @param {Number} spatialLayer
   *
   * @async
   * @throws {InvalidStateError} if Producer closed.
   * @throws {UnsupportedError} if not a video Producer.
   * @throws {TypeError} if wrong arguments.
   */
  setMaxSpatialLayer(spatialLayer: number): Promise<void>;
}
