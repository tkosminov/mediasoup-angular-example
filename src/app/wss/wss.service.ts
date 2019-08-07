import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { connect } from 'socket.io-client';

import { environment } from '../../environments/environment';

import * as mediasoupClient from 'mediasoup-client';
import { IDevice } from 'mediasoup-client/Device';
import { ITransport } from 'mediasoup-client/Transport';
import { IProducer } from 'mediasoup-client/Producer';
import { IConsumer } from 'mediasoup-client/Consumer';

type IOSocket = SocketIOClient.Socket & { request: (ioEvent: string, data?: any) => Promise<any> };

@Injectable()
export class WssService {
  private socket: IOSocket;
  private mediasoupDevice: IDevice;

  public producer: IProducer;
  public producerTransport: ITransport;
  public producerStream: MediaStream;

  public consumer: IConsumer;
  public consumerTransport: ITransport;
  public consumerStream: MediaStream;


  constructor(
    private readonly logger: NGXLogger
  ) {}

  public connect() {
    this.socket = connect(environment.wss_url) as IOSocket;

    this.socket.request = (ioEvent: string, data: object = {}) => {
      return new Promise((resolve) => {
        this.socket.emit(ioEvent, data, resolve);
      });
    };

    this.socket.on('connect', async () => {
      this.logger.info('WSS Connect');

      const data: RTCRtpCapabilities = await this.socket.request('getRouterRtpCapabilities');

      this.mediasoupDevice = new mediasoupClient.Device({});

      await this.mediasoupDevice.load({
        routerRtpCapabilities: data,
      });

      await this.createSendWebRTCTransport();

      await this.createRecvWebRTCTransport();
    });

    this.socket.on('disconnect', () => {
      this.socket.close();
    });
  }

  private async createSendWebRTCTransport() {
    const data = await this.socket.request('createProducerTransport', {
      forceTcp: false,
      rtpCapabilities: this.mediasoupDevice.rtpCapabilities,
    });

    this.producerTransport = this.mediasoupDevice.createSendTransport(data);

    this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      this.logger.info('Produce Producer Connect');

      try {
        const cpd = await this.socket.request('connectProducerTransport', { dtlsParameters });

        callback(cpd);
      } catch (err) {
        errback(err);
      }
    });

    this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      this.logger.info('Produce');

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
      this.logger.info('Produce Transport ConnectionsChange');

      switch (state) {
        case 'connecting':
          this.logger.info('connecting...');
          break;

        case 'connected':
          this.logger.info('connected');
          break;

        case 'failed':
          this.producerTransport.close();
          this.logger.info('failed');
          break;

        default: break;
      }
    });

    this.producer = await this.produce(this.producerTransport);
  }

  private async createRecvWebRTCTransport() {
    const data = await this.socket.request('createConsumerTransport', {
      forceTcp: false,
    });

    this.consumerTransport = this.mediasoupDevice.createRecvTransport(data);

    this.consumerTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.socket.request('connectConsumerTransport', {
        consumerTransportId: this.consumerTransport.id,
        dtlsParameters
      })
        .then(callback)
        .catch(errback);
    });

    this.consumerTransport.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          this.logger.info('connecting...');
          break;

        case 'connected':
          this.logger.info('connected');
          break;

        case 'failed':
          this.consumerTransport.close();
          this.logger.info('failed');
          break;

        default: break;
      }
    });

    this.consumer = await this.consume(this.consumerTransport);

    await this.socket.request('resume');
  }

  private async produce(transport: ITransport) {
    if (!this.mediasoupDevice.canProduce('video')) {
      return;
    }

    this.producerStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track = this.producerStream.getVideoTracks()[0];

    const params = { track };

    const producer = await transport.produce(params);

    return producer;
  }

  private async consume(transport: ITransport) {
    const { rtpCapabilities } = this.mediasoupDevice;

    const data = await this.socket.request('consume', { rtpCapabilities });

    const {
      producerId,
      id,
      kind,
      rtpParameters,
    } = data;

    const consumer = await transport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
    });

    this.consumerStream = new MediaStream();

    this.consumerStream.addTrack(consumer.track);

    return consumer;
  }
}
