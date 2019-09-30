import * as mediasoupClient from 'mediasoup-client';
import { IDevice } from 'mediasoup-client/Device';
import { ITransport } from 'mediasoup-client/Transport';
import { IProducer } from 'mediasoup-client/Producer';
import { IConsumer } from 'mediasoup-client/Consumer';
import { TKind, TPeer, TState, IPeerStat, ITransportStat, IVideoOrientation } from 'mediasoup-client/interfaces';

type IOSocket = SocketIOClient.Socket & { request: (ioEvent: string, data?: any) => Promise<any> };

export class MediasoupService {
  private mediasoupDevice: IDevice;

  private producerVideo: IProducer;
  private producerAudio: IProducer;

  private producerTransport: ITransport;
  private consumerTransport: ITransport;

  public producerVideoStream: MediaStream;
  public producerAudioStream: MediaStream;

  public consumersVideo: Map<string, IConsumer> = new Map();
  public consumersAudio: Map<string, IConsumer> = new Map();

  public consumersVideoStream: Map<string, MediaStream> = new Map();
  public consumersAudioStream: Map<string, MediaStream> = new Map();

  constructor(private readonly socket: IOSocket) {
    this.mediasoupDevice = new mediasoupClient.Device({});

    /**
     * Когда пользователь (не current_user) начинает передавать свой стрим
     */
    this.socket.on('mediaProduce', async (data: { user_id: string; kind: TKind }) => {
      try {
        switch (data.kind) {
          case 'video':
            await this.consumerVideoStart(data.user_id);
            break;
          case 'audio':
            await this.consumerAudioStart(data.user_id);
            break;
        }
      } catch (error) {
        console.error(error.message, error.stack);
      }
    });

    /**
     * Когда пользователь (любой) поворачивает камеру
     */
    this.socket.on('mediaVideoOrientationChange', async (data: {
      user_id: string; videoOrientation: IVideoOrientation
    }) => {
      console.log('mediaVideoOrientationChange', data);
    });

    /**
     * Когда пользователю (current_user) необходимо заново переподключить стрим
     */
    this.socket.on('mediaReproduce', async (data: { kind: TKind }) => {
      try {
        switch (data.kind) {
          case 'audio':
            this.producerAudioStart();
            break;
          case 'video':
            this.producerVideoStart();
            break;
        }
      } catch (error) {
        console.error(error.message, error.stack);
      }
    });

    /**
     * Когда пользователь (не current_user) ставит свой стрим на паузу
     */
    this.socket.on('mediaProducerPause', async (data: { user_id: string; kind: TKind }) => {
      console.log('mediaProducerPause', data);
    });

    /**
     * Когда пользователь (не current_user) снимает свой стрим с паузы
     */
    this.socket.on('mediaProducerResume', async (data: { user_id: string; kind: TKind }) => {
      console.log('mediaProducerResume', data);
    });

    /**
     * Когда кто-то разговаривает
     */
    this.socket.on('mediaActiveSpeaker', async (data: { user_id: string; volume: number }) => {
      console.log('mediaActiveSpeaker', data);
    });

    /**
     * Когда в комнате сменился воркер медиасупа и требуется переподключиться.
     */
    this.socket.on('mediaReconfigure', async () => {
      try {
        await this.load(true);
        await this.producerAudioStart();
        await this.producerVideoStart();
      } catch (error) {
        console.error(error.message, error.stack);
      }
    });
  }

  /**
   * Сменить воркер медиасупа в комнате
   */
  public async reConfigureMedia() {
    try {
      await this.socket.request('mediaReconfigure');
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Подключиться к медиасупу
   * @param skipConsume не принимать стримы от уже подключенных
   */
  public async load(skipConsume: boolean = false): Promise<void> {
    try {
      const data: { routerRtpCapabilities: RTCRtpCapabilities }
        = await this.socket.request('media', { action: 'getRouterRtpCapabilities' });

      if (!this.mediasoupDevice.loaded) {
        await this.mediasoupDevice.load(data);
      }

      await this.createProducerTransport();
      await this.createConsumerTransport();

      if (!skipConsume) {
        const audioProducerIds: string[] = await this.socket.request('media', { action: 'getAudioProducerIds' });

        audioProducerIds.forEach(async (id) => {
          await this.consumerAudioStart(id);
        });

        const videoProducerIds: string[] = await this.socket.request('media', { action: 'getVideoProducerIds' });

        videoProducerIds.forEach(async (id) => {
          await this.consumerVideoStart(id);
        });
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Отключиться от медиасупа
   */
  public async close(): Promise<void> {
    try {
      await this.producerVideoClose();
      await this.producerAudioClose();

      if (this.producerTransport && !this.producerTransport.closed) {
        this.producerTransport.close();
      }

      if (this.consumerTransport && !this.consumerTransport.closed) {
        this.consumerTransport.close();
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Создать транспорт для передачи своего стрима
   */
  private async createProducerTransport(): Promise<void> {
    try {
      const data: {
        type: TPeer, params: { id: string; iceParameters: RTCIceParameters; iceCandidates: RTCIceCandidate[]; dtlsParameters: object }
      } = await this.socket.request('media', { action: 'createWebRtcTransport', data: { type: 'producer' } });

      this.producerTransport = this.mediasoupDevice.createSendTransport(data.params);

      // 'connect' | 'produce' | 'producedata' | 'connectionstatechange'
      this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        await this.socket.request('media', { action: 'connectWebRtcTransport', data: { dtlsParameters, type: 'producer' } })
          .then(callback)
          .catch(errback);
      });

      this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        await this.socket.request('media', {
          action: 'produce',
          data: {
            producerTransportId: this.producerTransport.id,
            kind,
            rtpParameters,
          },
        }).then(({ id }) => callback({ id }))
          .catch(errback);
      });

      this.producerTransport.on('connectionstatechange', async (state: TState) => {
        switch (state) {
          case 'connecting': break;
          case 'connected': break;
          case 'failed':
            this.producerTransport.close();
            break;
          default: break;
        }
      });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Создать транспорт для приема стримов от других пользователей
   */
  private async createConsumerTransport(): Promise<void> {
    try {
      const data: {
        type: TPeer, params: { id: string; iceParameters: RTCIceParameters; iceCandidates: RTCIceCandidate[]; dtlsParameters: object }
      } = await this.socket.request('media', { action: 'createWebRtcTransport', data: { type: 'consumer'} });

      this.consumerTransport = this.mediasoupDevice.createRecvTransport(data.params);

      // 'connect' | 'connectionstatechange'
      this.consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        await this.socket.request('media', { action: 'connectWebRtcTransport', data: { dtlsParameters, type: 'consumer' } })
          .then(callback)
          .catch(errback);
      });

      this.consumerTransport.on('connectionstatechange', async (state: TState) => {
        switch (state) {
          case 'connecting': break;
          case 'connected': break;
          case 'failed':
            this.consumerTransport.close();
            break;
          default: break;
        }
      });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Начать передавать свой видео-стрим
   */
  public async producerVideoStart(): Promise<void> {
    try {
      if (this.mediasoupDevice.canProduce('video')) {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 200, height: 150 } });
        const videoTrack = videoStream.getVideoTracks()[0];

        if (videoTrack) {
          if (this.producerTransport && !this.producerTransport.closed) {
            this.producerVideo = await this.producerTransport.produce({ track: videoTrack });
          }

          // 'trackended' | 'transportclose'
          // this.producerVideo.on('transportclose', () => {});
        }
        this.producerVideoStream = videoStream;
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Поставить передачу своего видео-стрима на паузу
   */
  public async producerVideoPause(): Promise<void> {
    try {
      if (this.producerVideo && !this.producerVideo.paused) {
        this.producerVideo.pause();
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Снять с паузы передапчу своего видео-стрима
   */
  public async producerVideoResume(): Promise<void> {
    try {
      if (this.producerVideo && this.producerVideo.paused && !this.producerVideo.closed) {
        this.producerVideo.resume();
      } else if (this.producerVideo && this.producerVideo.closed) {
        await this.producerVideoStart();
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Остановить передачу своего видео-стрима (для повторной передачи требуется пересоздать продюсера)
   */
  public async producerVideoClose(): Promise<void> {
    try {
      if (this.producerVideo && !this.producerVideo.closed) {
        this.producerVideo.close();
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Начать передавать свой аудио-стрим
   */
  public async producerAudioStart(): Promise<void> {
    try {
      if (this.mediasoupDevice.canProduce('audio')) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = audioStream.getAudioTracks()[0];

        if (audioTrack) {
          if (this.producerTransport && !this.producerTransport.closed) {
            this.producerAudio = await this.producerTransport.produce({ track: audioTrack });
          }

          // 'trackended' | 'transportclose'
          // this.producerAudio.on('transportclose', () => {});
        }

        this.producerAudioStream = audioStream;
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Поставить передачу своего аудио-стрима на паузу
   */
  public async producerAudioPause(): Promise<void> {
    try {
      if (this.producerAudio && !this.producerAudio.paused) {
        this.producerAudio.pause();
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Снять с паузы передапчу своего аудио-стрима
   */
  public async producerAudioResume(): Promise<void> {
    try {
      if (this.producerAudio && this.producerAudio.paused && !this.producerAudio.closed) {
        this.producerAudio.resume();
      } else if (this.producerAudio && this.producerAudio.closed) {
        await this.producerAudioStart();
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Остановить передачу своего аудио-стрима (для повторной передачи требуется пересоздать продюсера)
   */
  public async producerAudioClose(): Promise<void> {
    try {
      if (this.producerAudio && !this.producerAudio.closed) {
        this.producerAudio.close();
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Поставить на паузу стрим юзера
   */
  public async targetProducerPause(data: { user_id: string, kind: TKind }) {
    try {
      await this.socket.request('media', { action: 'producerPause', data });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Снять с паузы стрим юзера
   * @param data юзер и тип стрима
   */
  public async targetProducerResume(data: { user_id: string, kind: TKind }) {
    try {
      await this.socket.request('media', { action: 'producerResume', data });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Остановить стрим юзера (чтобы возобновить передачу этому пользователю придется пересоздать продюсера)
   * @param data юзер и тип стрима
   */
  public async targetProducerClose(data: { user_id: string, kind: TKind }) {
    try {
      await this.socket.request('media', { action: 'producerClose', data });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Поставить на паузу стрим всех юзеров
   * @param data тип стрима
   */
  public async allProducerPause(data: { kind: TKind }) {
    try {
      await this.socket.request('media', { action: 'allProducerPause', data });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Снять с паузы стрим всех юзеров
   * @param data тип стрима
   */
  public async allProducerResume(data: { kind: TKind }) {
    try {
      await this.socket.request('media', { action: 'allProducerResume', data });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Остановить стрим всех юзеров (чтобы возобновить передачу этим пользователям придется пересоздать продюсера)
   * @param data тип стрима
   */
  public async allProducerClose(data: { kind: TKind }) {
    try {
      await this.socket.request('media', { action: 'allProducerClose', data });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Приня видео стрим от другого пользователя
   * @param user_id юзер, которой передает видео-стрим
   */
  private async consumerVideoStart(user_id: string): Promise<void> {
    try {
      const { rtpCapabilities } = this.mediasoupDevice;

      const consumeData: {
        id: string;
        producerId: string;
        kind: TKind;
        rtpParameters: RTCRtpParameters;
      } = await this.socket.request('media', {
        action: 'consume',
        data: { rtpCapabilities, user_id, kind: 'video' },
      });

      const consumer = await this.consumerTransport.consume(consumeData);

      // 'trackended' | 'transportclose'
      consumer.on('transportclose', () => {
        this.consumersVideoStream.delete(user_id);
        this.consumersVideo.delete(user_id);
      });

      this.consumersVideo.set(user_id, consumer);

      const stream = new MediaStream();

      stream.addTrack(consumer.track);

      this.consumersVideoStream.set(user_id, stream);
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Принять аудио стрим от другого пользователя
   * @param user_id юзер, который передает аудио-стрим
   */
  private async consumerAudioStart(user_id: string): Promise<void> {
    try {
      const { rtpCapabilities } = this.mediasoupDevice;

      const consumeData: {
        id: string;
        producerId: string;
        kind: TKind;
        rtpParameters: RTCRtpParameters;
      } = await this.socket.request('media', {
        action: 'consume',
        data: { rtpCapabilities, user_id, kind: 'audio' },
      });

      const consumer = await this.consumerTransport.consume(consumeData);

      // 'trackended' | 'transportclose'
      consumer.on('transportclose', async () => {
        this.consumersAudioStream.delete(user_id);
        this.consumersAudio.delete(user_id);
      });

      this.consumersAudio.set(user_id, consumer);

      const stream = new MediaStream();

      stream.addTrack(consumer.track);

      this.consumersAudioStream.set(user_id, stream);
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Перезапустить подключение
   * @param type тип транспорта
   */
  public async restartIce(type: TPeer): Promise<void> {
    try {
      const iceParameters: RTCIceParameters = await this.socket.request('media', {
        action: 'restartIce',
        data: {
          type,
        },
      });

      switch (type) {
        case 'producer':
          await this.producerTransport.restartIce({ iceParameters });
          break;
        case 'consumer':
          await this.consumerTransport.restartIce({ iceParameters });
          break;
      }
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Получить инфу о своем транспорте
   * @param type тип транспорта
   */
  public async getTransportStats(type: TPeer): Promise<{ type: TPeer, stats: ITransportStat[] }> {
    try {
      return await this.socket.request('media', {
        action: 'getTransportStats',
        data: {
          type,
        },
      });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Получить инфу о стриме, который передает пользователь
   * @param kind тип стрима
   * @param user_id уникальный идентификатор юзера
   */
  public async getProducerStats(kind: TKind, user_id: string): Promise<{ kind: TKind, user_id: string; stats: IPeerStat[] }> {
    try {
      return await this.socket.request('media', {
        action: 'getProducerStats',
        data: {
          kind,
          user_id,
        },
      });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Получить инфу о стриме, который принимает current_user от другого пользователя
   * @param kind тип стрима
   * @param user_id уникальный идентификатор юзера
   */
  public async getConsumerStats(kind: TKind, user_id: string): Promise<{ kind: TKind, user_id: string; stats: IPeerStat[] }> {
    try {
      return await this.socket.request('media', {
        action: 'getConsumerStats',
        data: {
          kind,
          user_id,
        },
      });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }

  /**
   * Получить опорный кадр у пользователя, стрим которого принимается.
   * Только для видео
   * @param user_id уникальный идентификатор юзера
   */
  public async requestConsumerKeyFrame(user_id: string): Promise<void> {
    try {
      return await this.socket.request('media', {
        action: 'requestConsumerKeyFrame',
        data: {
          user_id,
        },
      });
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }
}
