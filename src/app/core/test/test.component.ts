import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { WssService } from 'src/app/wss/wss.service';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  @ViewChild('producerVideo', { static: false }) producerVideo: ElementRef;
  @ViewChild('consumerVideo', { static: false }) consumerVideo: ElementRef;
  @ViewChild('consumerAudio', { static: false }) consumerAudio: ElementRef;

  // tslint:disable-next-line: variable-name
  private readonly user_id: string = 'aaa' + Math.random();

  constructor(
    private readonly logger: NGXLogger,
    private wssService: WssService
  ) { }

  async ngOnInit() {
    this.wssService.connect(this.user_id);
  }

  public showProducerVideo() {
    this.producerVideo.nativeElement.srcObject = this.wssService.mediasoup.producerVideoStream;
  }

  public showConsumerVideo() {
    const keys = Array.from(this.wssService.mediasoup.consumersVideoStream.keys());
    this.consumerVideo.nativeElement.srcObject = this.wssService.mediasoup.consumersVideoStream.get(keys[0]);
  }

  public showConsumerAudio() {
    const keys = Array.from(this.wssService.mediasoup.consumersAudioStream.keys());
    this.consumerAudio.nativeElement.srcObject = this.wssService.mediasoup.consumersAudioStream.get(keys[0]);
  }

  public pauseProducerVideo() {
    this.wssService.mediasoup.producerVideoPause();
  }

  public resumeProducerVideo() {
    this.wssService.mediasoup.producerVideoResume();
  }

  public pauseProducerAudio() {
    this.wssService.mediasoup.producerAudioPause();
  }

  public resumeProducerAudio() {
    this.wssService.mediasoup.producerAudioResume();
  }
}
