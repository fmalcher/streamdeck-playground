import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  requestStreamDecks,
  StreamDeckWeb,
} from '@elgato-stream-deck/webhid';
import { from, merge, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Book } from './book';

export interface DeckEvent {
  keyIndex: number;
  event: 'up' | 'down'
}


@Injectable({
  providedIn: 'root',
})
export class DeckService {

  events$ = new Subject<DeckEvent>();
  private deck?: StreamDeckWeb;

  books$ = this.loadBooks().pipe(shareReplay(1));

  selectedBook$ = this.events$.pipe(
    filter(e => e.event === 'down'),
    withLatestFrom(this.books$),
    map(([e, books]) => {
      if (e.keyIndex < books.length) {
        return books[e.keyIndex];
      } else {
        return null;
      }
    }),
    filter(book => !!book)
  );

  get hasDeck() {
    return !!this.deck;
  }

  constructor(private http: HttpClient) {}

  request() {
    if (this.deck) {
      return;
    }

    from(requestStreamDecks()).pipe(
      map((decks) => decks[0]),
      tap(deck => {
        this.deck = deck;
        this.doThingsWithCanvas(deck);
      }),
      switchMap((deck) => merge(this.fromDeckEventWithPayload(deck, 'down'), this.fromDeckEventWithPayload(deck, 'up')))
    ).subscribe(this.events$);

    /*this.events$.pipe(
      filter(e => e.event === 'down')
    ).subscribe(e => {
      this.deck?.fillKeyColor(e.keyIndex, 255, 0, 0)
    });

    this.events$.pipe(
      filter(e => e.event === 'up')
    ).subscribe(e => {
      this.deck?.fillKeyColor(e.keyIndex, 0, 0, 0)
    })*/         

  }

  doThingsWithCanvas(deck: StreamDeckWeb) {
    deck.clearPanel();

    /*const canvas = document.createElement('canvas');
    canvas.width = deck.ICON_SIZE;
    canvas.height = deck.ICON_SIZE;

    const img = document.createElement('img');
    img.src = 'IMG URL';

    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }
    ctx.font = '24pt Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;
    ctx.fillText('A', 8, 60, canvas.width * 0.8);
    setTimeout(() => {
      ctx.drawImage(img, 0, 0);
      ctx.save();
      document.querySelector('body')?.appendChild(img);

      deck.fillKeyCanvas(2, canvas);

    }, 100);
    console.log('DONE');*/

    this.books$.subscribe(books => {
      for (let i = 0; i < books.length; i++) {
        deck.fillKeyColor(i, 40, 60, 100);
      };
    });
  }

  fromDeckEvent(
    target: StreamDeckWeb,
    eventName: 'up' | 'down'
  ): Observable<number> {
    return new Observable((obs) => {
      target.on(eventName, (keyIndex) => obs.next(keyIndex));
    });
  }

  fromDeckEventWithPayload(
    target: StreamDeckWeb,
    eventName: 'up' | 'down'
  ): Observable<DeckEvent> {
    return this.fromDeckEvent(target, eventName).pipe(
      map((keyIndex) => ({ keyIndex, event: eventName }))
    );
  }

  setBrightness(percent: number) {
    this.deck?.setBrightness(percent);
  }

  loadBooks(): Observable<Book[]> {
    return this.http.get<Book[]>('https://api.angular.schule/books');
  }

  loadBook(isbn: string): Observable<Book> {
    return this.http.get<Book>('https://api.angular.schule/books/' + isbn);
  }

}
