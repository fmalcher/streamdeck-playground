import { Component } from '@angular/core';
import { DeckService } from './deck.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'streamdeck';

  selectedBook$ = this.ds.selectedBook$;

  constructor(private ds: DeckService) {
    this.ds.events$.subscribe(e => {
      
    });
  }

  request() {
    this.ds.request();
  }
}
