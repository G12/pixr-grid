import {Component, ElementRef, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import {ProjectService} from '../services/project.service';
import {Column, DialogData, FirstSatProject, IngressNameData, PortalRec, RawData} from '../project.data';
import {AngularFirestoreDocument} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import {UsersService} from '../services/users.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-pixr',
  templateUrl: './pixr.component.html',
  styleUrls: ['./pixr.component.css']
})
export class PixrComponent implements OnInit {

  // TODO add project selection for "readonly" historic projects
  // expansion panel
  panelOpenState = false;
  expandMe = true;
  left = 0;
  bannerLeft = 60;
  bannerLeftMargin = 60;
  logoutButtonWidth = 56;
  bannerWidth = 600;

  canvas: HTMLCanvasElement;
  /** Template reference to the canvas element */
  @ViewChild('canvasEl') canvasEl: ElementRef;
  /** Canvas 2d context */
  private ctx: CanvasRenderingContext2D;
  img: any;
  imgUrl: string; // assigned after project data aquired from Firebase
  width: number;
  height: number;
  // Firestore data
  firstSatProjectDoc: AngularFirestoreDocument; // copied from project.service
  rawDataDoc: AngularFirestoreDocument;
  firstSatProject: FirstSatProject;
  rawData: RawData;

  // Banner Info
  bannerInfo = '  @ anonymous arrived!';
  // User information
  ingressName = '';
  ingressNamesDoc: AngularFirestoreDocument;
  allIngressNames: IngressNameData[];
  private busy = false;

  dialogData: DialogData = {name: '', url: ''};

  constructor(public authService: AuthService,
              private projectService: ProjectService,
              private usersService: UsersService,
              public dialog: MatDialog) {

    this.rawData = {id: '', name: '', columns: []};
  }

  @HostListener('window:scroll', ['$event'])
  doSomething(event): void {
    this.left = window.pageXOffset;
    this.bannerLeft = window.pageXOffset + this.bannerLeftMargin;
    this.bannerWidth = (
      window.innerWidth - this.bannerLeftMargin - this.logoutButtonWidth);
  }

  ///////////////  initialization helper methods //////////////////////
  subscribeToFirstSaturdayProj(id): void {
    this.firstSatProjectDoc = this.projectService.getfirstSatProjectDocRef(id);
    this.firstSatProjectDoc.get().subscribe(doc => {
      if (doc.exists) {
        // console.log('defaultFirstSaturdayProj: ' + JSON.stringify(data.data()));
        this.firstSatProject = doc.data() as FirstSatProject;
        this.width = this.firstSatProject.canvasData.displayWidth;
        this.height = this.firstSatProject.canvasData.displayHeight;
        this.initImage(this.firstSatProject.canvasData.imgUrl);
      } else {
        // doc.data() will be undefined in this case
        console.log('No firstSatProjectDocRef!');
      }
    });
  }

  subscribeToRawdataFor(id: string): void {
    this.rawDataDoc = this.projectService.getRawDataDocRef(id);
    this.rawDataDoc.get().subscribe(doc => {
      if (doc.exists) {
        console.log('defaultRawData: ' + JSON.stringify(doc.data()));
        this.rawData = doc.data() as RawData;
      } else {
        // doc.data() will be undefined in this case
        console.log('No rawDataDocRef!');
      }
    });
  }

  getIngressNameList(): void {
    // this.usersService.getUserDocs()
    // Subscribe to all the RawDataDocs
    this.ingressNamesDoc = this.usersService.getUserDocs().subscribe(data => {
      this.allIngressNames = data.map(e => {
        return {
          id: e.payload.doc.id,
          ...e.payload.doc.data()
        } as string[];
      });
      console.log(this.allIngressNames);
    });
  }

  ngOnInit(): void {
    this.bannerWidth = window.innerWidth;
    // For client app first get image data from Firebase then
    // Get BootParam for fs_user then subscribe to default FirstSaturdayProj
    this.projectService.userBootParamDocRef.get().subscribe(data => {
      if (data.exists) {
        console.log('BootParam for fs_user: ' + JSON.stringify(data.data()));
        const userBootParam = data.data();
        const id = userBootParam.project_id;
        // Once we have default project id we can subscribe
        this.subscribeToFirstSaturdayProj(id);
        this.subscribeToRawdataFor(id);
        this.getIngressNameList();
      } else {
        // doc.data() will be undefined in this case
        console.log('No projectService.userBootParamDocRef!');
      }
    });


  }

  initCanvas(): void {
    this.canvas = this.canvasEl.nativeElement;
    // MOUSE DOWN EVENT
    this.canvas.addEventListener('mousedown', (event): any => {
      // TODO
      this.handleMouseDown(event);
    });
    // End of MOUSE DOWN EVENT
    this.ctx = this.canvas.getContext('2d');
    // this.drawImageOnLoad(this.ctx, this.img);
    // this.img.onload = () => {
    this.ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height);
    // };
    this.img.onError = () => {
      alert('Error Loading Image: ' + this.imgUrl);
    };
  }

  initImage(src: string): void {
    this.imgUrl = src;
    this.img = new Image();
    this.img.src = this.imgUrl;
  }

  /*
  getDimensions(src): void{
    if (!this.img) {
      this.initImage(src);
    }
    this.img.onload = () => {
      console.log('Width: ' + this.img.width + ' Height: ' + this.img.height);
    };
    this.img.onError = () => {
      console.log('Error loading image: ' + src);
    };
  }
   */

  drawCanvas(): void {
    this.initCanvas();
  }

  /// Mouse Events ( after canvas initialized
  handleMouseDown(e): void {
    if (!this.busy){
      this.busy = true;
      const rect = this.canvas.getBoundingClientRect();
      const xy = this.getXY(e);
      const x = xy[0];
      const y = xy[1];
      // alert('x: ' + x + ' y: ' + y);
      this.rawData.columns.forEach(col => {
        if (x > (col.offset - col.width) && x < col.offset) {
          col.portals.forEach(pr => {
            if ((y > pr.t && y < (pr.b + pr.t)) && (x < (pr.r + pr.l) && x > pr.l)) {
              // alert('FOUND: top:' + pr.t + ' bottom:' + pr.b + ' Column: ' + pr.colName);

              this.drawFrame(pr, '#ffcc00', 4);
              this.busy = false;
              return;
            }
          });
        }
      });
    }
    this.busy = false;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(PortalInfoDialogComponent, {
      width: '250px',
      data: {name: this.dialogData.name, animal: this.dialogData.url}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.dialogData = result;
    });
  }

  drawFrame(p: PortalRec, color: string, lineWidth: number): void{
    this.ctx.strokeStyle = color; // '#FFFFFF';
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(p.l, p.t, p.r, p.b);
    // this.drawShadow(p, lineWidth); // TODO shadow wont work here
  }

  drawShadow(p: PortalRec, lw: number): void{
    // canvas.strokeStyle = "rgba("+r+","+g+","+b+","+alpha+")"; TODO control opacity
    this.ctx.strokeStyle = '#000000';
    const lineWidth = 10;
    this.ctx.lineWidth = lineWidth;
    const ofst = lineWidth - lw;
    this.ctx.moveTo(p.l + p.r + ofst, p.t + ofst);
    this.ctx.lineTo(p.l + p.r + ofst, p.t + p.b + ofst);
    this.ctx.stroke();
    this.ctx.moveTo(p.l + p.r + lineWidth, p.t + p.b + ofst);
    this.ctx.lineTo(p.l + lineWidth, p.t + p.b + ofst);
    this.ctx.stroke();
  }

  private getXY(event: MouseEvent): any {
    // this.imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const rect = this.canvas.getBoundingClientRect();
    const left = event.clientX - rect.left; //  - this.currentColumn.width; // TODO fix Hack job
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [x, y];
  }

  setIngressName(): void {
    const name = prompt('Please enter a Name', this.SavedIngressName);
    if (name && name !== '') {
      this.ingressName = name;
      this.usersService.updateIngressName(name);
      this.expandMe = false;
      this.drawCanvas();
      this.bannerInfo = '  @ ' + name + ' started working!' + this.bannerInfo;
    }
  }

  get SavedIngressName(): string {
    let test: IngressNameData;
    if (this.allIngressNames) {
      // const found = array1.find(element => element > 10);
      test = this.allIngressNames.find((element => element.id === this.authService.user.uid));
    }
    return test ? test.name : '';
  }

  logout(): void {
    if (confirm('Log Out?')) {
      this.authService.logout();
    } else {
      // this.bannerInfo = this.bannerInfo.slice(0, 10);
      // this.bannerInfo
      this.bannerInfo = '  @ ' + this.SavedIngressName + ' did something and then some more and then a whole lot of nothing '
        + this.bannerInfo;
    }
  }

  showColumnInfo(column: Column): void {
    alert(column.name + ' has ' + column.portals.length + ' portals');
  }
}

@Component({
  selector: 'app-portal-info-dialog',
  templateUrl: 'portal-info-dialog.html',
})
export class PortalInfoDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PortalInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
