import {Component, ElementRef, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import {ProjectService} from '../services/project.service';
import {Column, DialogData, FirstSatProject, IngressNameData, PortalRec, RawData} from '../project.data';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import {UsersService} from '../services/users.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Subscription} from 'rxjs';
import {MapDialogComponent} from '../dialogs/map/map-dialog.component';

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
  rawDataSubscription: Subscription;

  // Banner Info
  bannerInfo = '  @ anonymous arrived!';
  // User information
  ingressName = '';
  ingressNamesDoc: AngularFirestoreDocument;
  allIngressNames: IngressNameData[];
  private busy = false;

  dialogData: DialogData = {name: '', url: '', col: null, portal: null, rawData: null};

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
  /*
  snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                console.log("New city: ", change.doc.data());
            }
            if (change.type === "modified") {
                console.log("Modified city: ", change.doc.data());
            }
            if (change.type === "removed") {
                console.log("Removed city: ", change.doc.data());
            }
        });
   */

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
    this.rawDataSubscription = this.rawDataDoc.get().subscribe(doc => {
      if (doc.exists) {
        // console.log('defaultRawData: ' + JSON.stringify(doc.data()));
        this.rawData = doc.data() as RawData;
        console.log('subscribeToRawdataFor ' + this.rawData.name);
        this.drawPortalFrames();
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
      console.log('User List: ' + JSON.stringify(this.allIngressNames));
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

  drawCanvas(): void {
    this.initCanvas();
  }

  drawPortalFrames(): void {

    if (this.ctx && this.rawData.columns) {
      this.rawDataDoc.get().subscribe(value => {
        this.rawData = value.data() as RawData;
        this.rawData.columns.forEach((column: Column) => {
          column.portals.forEach((portal: PortalRec) => {
            if (portal.status && portal.status === '1') {
              this.drawFrame(portal, '#FFFFFF', 3);
            }
          });
        });
      });
      /*
      this.rawData.columns.forEach((column: Column) => {
        column.portals.forEach((portal: PortalRec) => {
          if (portal.status && portal.status === '1') {
            this.drawFrame(portal, '#FFFFFF', 3);
          }
        });
      });
       */
    }
  }

  getLatestRawData(): void {
    this.rawDataDoc.get().subscribe(doc => {
      if (doc.exists) {
        console.log('defaultRawData: ' + JSON.stringify(doc.data()));
        this.rawData = doc.data() as RawData;
        return true;
        // this.drawPortalFrames();
      } else {
        // doc.data() will be undefined in this case
        console.log('No rawDataDocRef!');
        return false;
      }
    });
  }

  /// Mouse Events ( after canvas initialized
  handleMouseDown(e): void {
    if (!this.busy) {
      this.busy = true;
      const xy = this.getXY(e);
      const x = xy[0];
      const y = xy[1];
      // alert('x: ' + x + ' y: ' + y);
      this.rawData.columns.forEach(col => {
        if (x > (col.offset - col.width) && x < col.offset) {
          col.portals.forEach(pr => {
            if ((y > pr.t && y < (pr.b + pr.t)) && (x < (pr.r + pr.l) && x > pr.l)) {
              // alert('FOUND: top:' + pr.t + ' bottom:' + pr.b + ' Column: ' + pr.colName);
              this.dialogData = {
                name: '',
                url: '',
                rawData: this.rawData,
                col,
                portal: pr
              };
              this.openPortalDialog(this.dialogData); // send event to open dialog ???
              // this.drawFrame(pr, '#ffcc00', 4);
              this.busy = false;
              return;
            }
          });
        }
      });
    }
    this.busy = false;
  }

  drawFrame(p: PortalRec, color: string, lineWidth: number): void {
    this.ctx.strokeStyle = color; // '#FFFFFF';
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(p.l, p.t, p.r, p.b);
    // this.drawShadow(p, lineWidth); // TODO shadow wont work here
  }

  drawShadow(p: PortalRec, lw: number): void {
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
      this.drawPortalFrames();
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
    this.openMapDialog(this.dialogData);
    // alert('open Column Info dialog');
    // this.drawPortalFrames();
  }

  openPortalDialog(dialogData: DialogData): void {
    const dialogRef = this.dialog.open(PortalInfoDialogComponent, {
      width: '500px',
      height: '300px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('');
      if (result) {
        const dat = result as DialogData;
        dat.portal.status = '1'; // TODO make a static constant for this
        // console.log('dialogRef.afterClosed url: ' + dat.portal.url);
        this.rawDataDoc.update(this.rawData).then(value => {
          console.log('Updated rawData.name: ' + this.rawData.name);
          this.drawPortalFrames();
        });
      } else {
        console.log('dialogRef.afterClosed NO Data');
      }
    });
  }

  openMapDialog(dialogData: DialogData): void {
    const dialogRef = this.dialog.open(MapDialogComponent, {
      width: '600px',
      height: '600px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Return Value: ' + JSON.stringify(result));
      } else {
        console.log('dialogRef.afterClosed NO Data');
      }
    });
  }
}

@Component({
  selector: 'app-portal-info-dialog',
  templateUrl: 'portal-info-dialog.html',
})
export class PortalInfoDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PortalInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  onCancelClick(): void {
    console.log('Dialog Closed');
    this.dialogRef.close();
  }

  // TODO this is not usefull right now could be usefull for standalone dialog component
  onSaveClick(data: DialogData): void {
    if (data) {
      console.log('Save Portal Data click data url' + data.portal.url);
    } else {
      console.log('Save Portal Data returns NO DATA');
    }
    this.dialogRef.close();
  }
}
