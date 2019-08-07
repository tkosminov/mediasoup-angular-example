import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WssService } from './wss.service';

@NgModule({
  declarations: [],
  providers: [
    WssService,
  ],
  imports: [
    CommonModule
  ]
})
export class WssModule {}
