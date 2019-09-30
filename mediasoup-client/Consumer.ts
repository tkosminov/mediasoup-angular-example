// tslint:disable: no-any
// tslint:disable: jsdoc-format
// tslint:disable: no-redundant-jsdoc

export interface IConsumer {
  /**
   * @private
   *
   * @emits transportclose
   * @emits trackended
   * @emits @getstats
   * @emits @close
   */
  new ({
    id,
    localId,
    producerId,
    track,
    rtpParameters,
    appData,
  }: {
    id: string;
    localId: string;
    producerId: string;
    track: MediaStreamTrack;
    rtpParameters: RTCRtpParameters;
    appData?: object;
  });

  /**
   * Consumer id.
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
   * Associated Producer id.
   *
   * @returns {String}
   */
  producerId: string;

  /**
   * Whether the Consumer is closed.
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
   * Whether the Consumer is paused.
   *
   * @returns {Boolean}
   */
  paused: boolean;

  /**
   * App custom data.
   *
   * @returns {Object}
   */
  appData: object;

  on(type: any, listener: (...params: any) => Promise<void> | void): Promise<void> | void;

  /**
   * Closes the Consumer.
   */
  close(): void;

  // /**
  //  * Transport was closed.
  //  *
  //  * @private
  //  */
  // transportClosed(): void;

  /**
   * Get associated RTCRtpReceiver stats.
   *
   * @async
   * @returns {RTCStatsReport}
   * @throws {InvalidStateError} if Consumer closed.
   * @return
   */
  getStats(): Promise<RTCStatsReport>;

  /**
   * Pauses receiving media.
   */
  pause(): void;

  /**
   * Resumes receiving media.
   */
  resume(): void;
}
