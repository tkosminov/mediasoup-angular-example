import * as mediasoupClient from 'mediasoup-client';
import { IDevice } from 'mediasoup-client/Device';
import { ITransport } from 'mediasoup-client/Transport';
import { IProducer } from 'mediasoup-client/Producer';
import { IConsumer } from 'mediasoup-client/Consumer';

type IOSocket = SocketIOClient.Socket & { request: (ioEvent: string, data?: any) => Promise<any> };

export class MediasoupService {
  private mediasoupDevice: IDevice;

  private producerVideo: IProducer;
  private producerAudio: IProducer;

  public producerVideoStream: MediaStream;
  public producerAudioStream: MediaStream;

  private producerTransport: ITransport;
  private consumerTransport: ITransport;

  private consumersVideo: Map<string, IConsumer> = new Map();
  private consumersAudio: Map<string, IConsumer> = new Map();

  public consumersVideoStream: Map<string, MediaStream> = new Map();
  public consumersAudioStream: Map<string, MediaStream> = new Map();

  constructor(private readonly socket: IOSocket) {}

  public async createMediasoupDevice() {
    this.mediasoupDevice = new mediasoupClient.Device({});

    const data: RTCRtpCapabilities = await this.socket.request('getRouterRtpCapabilities');

    await this.mediasoupDevice.load({
      routerRtpCapabilities: data,
    });
  }

  public async createProducerTransport() {
    console.log('createProducerTransport');

    const data = await this.socket.request('createProducerTransport', {
      forceTcp: false,
      rtpCapabilities: this.mediasoupDevice.rtpCapabilities,
    });

    this.producerTransport = this.mediasoupDevice.createSendTransport(data);

    this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        const cpd = await this.socket.request('connectProducerTransport', { dtlsParameters });
        callback(cpd);
      } catch (err) {
        errback(err);
      }
    });

    this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { id } = await this.socket.request('produce', {
          producerTransportId: this.producerTransport.id,
          kind,
          rtpParameters,
        });

        callback({ id });
      } catch (err) {
        errback(err);
      }
    });

    this.producerTransport.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          break;

        case 'connected':
          break;

        case 'failed':
          this.producerTransport.close();
          break;

        default: break;
      }
    });

    await this.produceVideo();
    await this.produceAudio();
  }

  private async produceVideo() {
    console.log('produceVideo');

    if (this.mediasoupDevice.canProduce('video')) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });

        const videoTrack = videoStream.getVideoTracks()[0];
        if (videoTrack) {
          this.producerVideo = await this.producerTransport.produce({ track: videoTrack });
        }

        this.producerVideoStream = videoStream;
      } catch (error) {
        this.producerVideo = null;
        this.producerVideoStream = null;
      }
    }
  }

  private async produceAudio() {
    console.log('produceAudio');

    if (this.mediasoupDevice.canProduce('audio')) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          this.producerAudio = await this.producerTransport.produce({ track: audioTrack });
        }

        this.producerAudioStream = audioStream;
      } catch (error) {
        this.producerAudio = null;
        this.producerAudioStream = null;
      }
    }
  }

  public async createConsumerTransport() {
    console.log('createConsumerTransport');

    const data = await this.socket.request('createConsumerTransport', {
      forceTcp: false,
    });

    this.consumerTransport = this.mediasoupDevice.createRecvTransport(data);

    this.consumerTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.socket.request('connectConsumerTransport', {
        consumerTransportId: this.consumerTransport.id,
        dtlsParameters,
      })
        .then(callback)
        .catch(errback);
    });

    this.consumerTransport.on('connectionstatechange', async (state) => {
      switch (state) {
        case 'connecting':
          break;

        case 'connected':
          break;

        case 'failed':
          this.consumerTransport.close();
          break;

        default: break;
      }
    });
  }

  public async consumeVideo(consumer_id: string) {
    console.log('consumeVideo');

    const { rtpCapabilities } = this.mediasoupDevice;

    const consumeData = await this.socket.request('consume', { rtpCapabilities, user_id: consumer_id, kind: 'video' });

    const consumer = await this.createConsumer(consumeData);

    const stream = new MediaStream();
    stream.addTrack(consumer.track);

    this.consumersVideoStream.set(consumer_id, stream);
    this.consumersVideo.set(consumer_id, consumer);

    await this.socket.request('resume', { user_id: consumer_id });
  }

  public async consumeAudio(consumer_id: string) {
    console.log('consumeAudio');

    const { rtpCapabilities } = this.mediasoupDevice;

    const consumeData = await this.socket.request('consume', { rtpCapabilities, user_id: consumer_id, kind: 'audio' });

    const consumer = await this.createConsumer(consumeData);

    const stream = new MediaStream();
    stream.addTrack(consumer.track);

    this.consumersAudioStream.set(consumer_id, stream);
    this.consumersAudio.set(consumer_id, consumer);
  }

  private async createConsumer(consumeData: { id: string; producerId: string; kind: 'audio' | 'video'; rtpParameters: RTCRtpParameters }) {
    console.log('createConsumer');

    const {
      id,
      producerId,
      kind,
      rtpParameters,
    } = consumeData;

    if (!Object.keys(consumeData).length) {
      return;
    }

    return await this.consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
    });
  }

  public async syncPeers() {
    console.log('syncPeers');

    const connectedMembers: { user_ids: string[] } = await this.socket.request('getRoomInfo');

    return await connectedMembers.user_ids.forEach(async (consumer_id) => {
      await this.consumeVideo(consumer_id);
      await this.consumeAudio(consumer_id);
    });
  }

  public async deletePeer(consumer_id: string) {
    console.log('deletePeer');

    this.consumersVideoStream.delete(consumer_id);
    this.consumersAudioStream.delete(consumer_id);
  }

  public pauseProducerVideo() {
    this.producerVideo.pause();
  }

  public pauseProducerAudio() {
    this.producerAudio.pause();
  }

  public resumeProducerVideo() {
    this.producerVideo.resume();
  }

  public resumeProducerAudio() {
    this.producerAudio.resume();
  }
}
