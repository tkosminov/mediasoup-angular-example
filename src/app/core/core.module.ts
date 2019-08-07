import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestModule } from './test/test.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TestModule
  ],
  exports: [
    TestModule,
  ]
})
export class CoreModule {}
