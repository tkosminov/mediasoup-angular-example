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

  constructor(
    private readonly logger: NGXLogger,
    private wssService: WssService
  ) { }

  async ngOnInit() {
    await this.wssService.connect();
  }

  public showProducerVideo() {
    this.producerVideo.nativeElement.srcObject = this.wssService.producerStream;
  }

  public showConsumerVideo() {
    this.consumerVideo.nativeElement.srcObject = this.wssService.consumerStream;
  }
}
