import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {speedDialFabAnimations} from './speed-dial-animations';

@Component({
  selector: 'app-speed-dial',
  templateUrl: './speed-dial.component.html',
  styleUrls: ['./speed-dial.component.scss'],
  animations: [speedDialFabAnimations]
})
export class SpeedDialComponent implements OnInit {

  fabButtons = [
    {
      icon: 'file_download',
      action: 'miny'
    },
    {
      icon: 'drag_handle',
      action: 'minus'
    },
    {
      icon: 'file_upload',
      action: 'plus'
    }
  ];
  buttons = [];
  fabTogglerState = 'inactive';
  // @Output() open: EventEmitter<any> = new EventEmitter();
  @Output() action: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

  showItems(): void {
    this.fabTogglerState = 'active';
    this.buttons = this.fabButtons;
  }

  hideItems(): void {
    this.fabTogglerState = 'inactive';
    this.buttons = [];
  }

  onToggleFab(): void {
    this.buttons.length ? this.hideItems() : this.showItems();
  }

  onClick(action: string): void {
    this.action.emit(action);
  }
}
