import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StompClientService implements OnDestroy {
  private rxStomp: RxStomp;

  constructor() {
    this.rxStomp = new RxStomp();
    const wsUrl = environment.apiUrl.replace('http', 'ws').replace('/api', '') + '/ws/restaurant';
    this.rxStomp.configure({
      brokerURL: wsUrl,
      reconnectDelay: 2000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    this.rxStomp.activate();
  }

  public watch(topic: string) {
    return this.rxStomp.watch(topic);
  }

  public deactivate() {
    this.rxStomp.deactivate();
  }

  ngOnDestroy(): void {
    this.deactivate();
  }
}
