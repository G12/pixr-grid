import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {PortalRec} from '../../project.data';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, AfterViewInit {

  @ViewChild('canvasElement') canvasElement: ElementRef;
  @Input() portalRec: PortalRec;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  width = 100;
  height = 100;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.canvas = this.canvasElement.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    /*
    console.log('l:' + this.portalRec.l + ' t:' + this.portalRec.t +
      ' r:' + this.portalRec.r + ' b:' + this.portalRec.b);
    this.ctx.drawImage(this.portalRec.img, 0, 0,
      this.portalRec.img.width, this.portalRec.img.height);
     */
    const scale = this.portalRec.scale;
    const rec = this.portalRec;
    const d = 6 * this.portalRec.scale; // scale area down to get rid of ragged edges
    this.width = (rec.r - 2 * d) * scale;
    this.height = (rec.b - 2 * d) * scale;
    const imgData = this.portalRec.ctx.getImageData((rec.l + d)  * scale,
      (rec.t + d) * scale, (rec.r - d) * scale, (rec.b - d) * scale);
    console.log('imgData.width: ' + imgData.width + ' imgData.height: ' + imgData.height);
    setTimeout(() =>  {
      this.ctx.putImageData(imgData, 0, 0);
    }, 500);
  }

}
