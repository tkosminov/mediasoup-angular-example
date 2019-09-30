import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { connect } from 'socket.io-client';

import { environment } from '../../environments/environment';
import { MediasoupService } from './wss.mediasoup';

type IOSocket = SocketIOClient.Socket & { request: (ioEvent: string, data?: any) => Promise<any> };

@Injectable()
export class WssService {
  private socket: IOSocket;

  public mediasoup: MediasoupService;

  constructor(
    private readonly logger: NGXLogger
  ) {}

  // tslint:disable-next-line: variable-name
  public connect(current_user_id: string) {
    this.socket = connect(environment.wss_url, {
      query: {
        session_id: 1,
        user_id: current_user_id,
      }
    }) as IOSocket;

    this.socket.request = (ioEvent: string, data: object = {}) => {
      return new Promise((resolve) => {
        this.socket.emit(ioEvent, data, resolve);
      });
    };

    this.mediasoup = new MediasoupService(this.socket);

    this.socket.on('connect', async () => {
      await this.mediasoup.load();
      await this.mediasoup.producerVideoStart();
      await this.mediasoup.producerAudioStart();
    });

    this.socket.on('mediaClientConnected', async (msg: { user_id: string }) => {
      // pass
    });

    this.socket.on('mediaClientDisconnect', async (msg: { user_id: string }) => {
      // await this.mediasoup.deletePeer(msg.user_id);
    });
  }
}
