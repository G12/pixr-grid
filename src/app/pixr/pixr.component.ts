import {AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import {ProjectService} from '../services/project.service';
import {
  BootParam,
  Column, ColumnChar,
  ColumnRecData,
  FirstSatProject,
  IngressNameData,
  LatLng,
  Messages,
  MsgDat,
  PortalRec,
  RawData
} from '../project.data';
import {AngularFirestoreDocument} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import {UsersService} from '../services/users.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Subscription} from 'rxjs';
import {MapDialogComponent} from '../dialogs/map/map-dialog.component';

// https://fevgames.net/ifs/ifsathome/2021-03/17631729871888592910113823558419958.jpg

@Component({
  selector: 'app-pixr',
  templateUrl: './pixr.component.html',
  styleUrls: ['./pixr.component.css']
})
export class PixrComponent implements OnInit, AfterViewInit {

  P_EMPTY = -1;
  P_FULL = 1;
  P_NO_URL = 2;
  P_NO_NAME = 3;

  // TODO add project selection for "readonly" historic projects
  // expansion panel
  panelOpenState = false;
  expandMe = true;
  left = 0;
  bannerLeft = 60;
  bannerLeftMargin = 60;
  logoutButtonWidth = 56;
  bannerWidth: number;

  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  /** Template reference to the canvas element */
  @ViewChild('canvasEl') canvasEl: ElementRef;
  @ViewChild('myImage') myImage: ElementRef;
  /** Canvas 2d context */
  private ctx: CanvasRenderingContext2D;
  img: any;

  //////////////////////////  Hard Code ZONE Caution
  imgUrl = 'assets/FirstSatBlackSmall.jpg'; // 'assets/FirstSatBlack.jpg';
  // imgUrl: string; // assigned after project data aquired from Firebase
  realWidth = 4887;
  realHeight = 2699;
  logBuffer = '';
  ///////////////////////////////////////////////////

  width: number;
  height: number;
  // Firestore data
  firstSatProjectDoc: AngularFirestoreDocument; // copied from project.service
  rawDataDoc: AngularFirestoreDocument;
  firstSatProject: FirstSatProject;
  rawData: RawData;
  rawDataSubscription: Subscription;
  portalRecs: PortalRec[];
  logMessages: Messages;
  logMsgArray: MsgDat[];

  // Banner Info
  bannerInfo = '  @ anonymous arrived!';
  // User information
  ingressName = '';
  ingressNamesDoc: AngularFirestoreDocument;
  allIngressNames: IngressNameData[];
  private busy = false;
  // private canPaste = true; // TODO dynamically assign this when clipboard is full
  // clipBoard: PortalRec;

  // dialogData: DialogData = {id: '', name: '', url: '', latLng: null, columnName: '', portalIndex: null};
  private portalDialogRef: MatDialogRef<PortalInfoDialogComponent, PortalRec>;
  validated = false; // After user sets ingress name set true and shoe images

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

  subscribeToRawdataFor(id: string): void {
    this.rawDataDoc = this.projectService.getRawDataDocRef(id);
    this.rawDataSubscription = this.rawDataDoc.get().subscribe(doc => {
      if (doc.exists) {
        this.rawData = doc.data() as RawData;
        this.logger('In rawDataSubscription - rawData name:' + this.rawData.name + ' id: ' + this.rawData.id);
        // this.width = this.rawData.displayWidth;
        // this.bannerWidth = this.width;
        // this.height = this.rawData.displayHeight;

        // this.imgUrl = this.rawData.imgUrl;

        // Subscribe to all the portalRec docs
        this.projectService.getPortalRecs(id).subscribe(data => {
          this.portalRecs = data.map(e => {
            return {
              id: e.payload.doc.id,
              ...e.payload.doc.data()
            } as PortalRec;
          });
          this.projectService.getMsgLog(id).get().subscribe(doc2 => {
            if (doc2.exists){
              this.logMessages = doc2.data() as Messages;
              this.logMsgArray = this.logMessages.messages;
            }
          });
          this.ingressNamesDoc = this.usersService.getUserDocs().subscribe(dat => {
            this.allIngressNames = dat.map(e => {
              return {
                id: e.payload.doc.id,
                ...e.payload.doc.data()
              } as string[];
            });
            // this.initImage(this.imgUrl);
            this.drawPortalFrames();
          });
        });
      } else {
        // doc.data() will be undefined in this case
      }
    });
  }

  ngAfterViewInit(): void {
    // setTimeout(() => {
    // this.initImage(this.imgUrl);
    // this.initCanvas();
      // this.bannerWidth = window.innerWidth;
    // });
    // For client app first get image data from Firebase then
    // Get BootParam for fs_user then subscribe to default FirstSaturdayProj
    this.projectService.userBootParamDocRef.get().subscribe(data => {
      if (data.exists) {
        const userBootParam = data.data() as BootParam;
        const id = userBootParam.project_id;
        // const portalsCollectionName = userBootParam.portalCollectionName;
        // Once we have default project id we can subscribe
        // this.subscribeToFirstSaturdayProj(id);
        this.subscribeToRawdataFor(id);
      } else {
        // doc.data() will be undefined in this case
      }
    });
  }

  ngOnInit(): void {
  }

  onImageLoad(myImage: HTMLImageElement): void {
    this.width = myImage.width;
    this.height = myImage.height;
    this.img = myImage;
    this.bannerWidth = this.width;
  }

  initCanvas(): void {

    this.canvas = this.canvasEl.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    this.logger('Browser Dimensions: ' + this.width + ' x ' + this.height +
                ' and Real Dimensions' + this.realWidth + ' x ' + this.realHeight);
    if (this.width !== this.realWidth) {
      this.width = this.realWidth;
      this.height = this.realHeight;
    }
    this.ctx.drawImage(this.img, 0, 0, this.width, this.height);

    // MOUSE MOVE EVENT
    this.canvas.addEventListener('mousemove', (event): any => {
      const xy = this.getXY(event);
      const x = xy[0];
      const y = xy[1];
      let isPortal = false;
      let canPaste = false;
      this.rawData.columns.forEach(column => {
        column.portals.forEach(pr => {
          if ((y > pr.t && y < (pr.b + pr.t)) && (x < (pr.r + pr.l) && x > pr.l)) {
            isPortal = true;
            if (this.projectService.clipboard) {
              // when the clipboard is full
              canPaste = true;
              // but you cannot paste into a loaded portal
              const pr2 = this.portalRecs.find(p => p.colName === pr.colName && p.index === pr.index);
              if (pr2) {
                canPaste = !pr2.latLng;
              }
            } else {
              canPaste = false;
            }
          }
        });
      });
      if (isPortal) {
        if (canPaste) {
          this.canvasEl.nativeElement.style.cursor = 'cell';
        } else {
          this.canvasEl.nativeElement.style.cursor = 'pointer';
        }
      } else {
        this.canvasEl.nativeElement.style.cursor = 'default';
      }
    });

    // MOUSE DOWN EVENT
    this.canvas.addEventListener('mousedown', (event): any => {
      // TODO
      this.handleMouseDown(event);
    });
    // End of MOUSE DOWN EVENT
  }

  updatePortalRecs(prtl: PortalRec): void {
    // Once we have the new collection search for incoming rec if found update else add
    const path = prtl.colName + ':' + prtl.index;
    const test: PortalRec = this.portalRecs.find(p => (p.colName === prtl.colName && p.index === prtl.index));
    let msg = this.ingressName;
    if (test) {
      if (test.latLng) {
        msg = msg + ' Updated ';
      } else { // Erasing record
        msg = msg + ' Erased ';
      }
      this.projectService.updatePortalRec(this.rawData.id, path, prtl);
    } else {
      msg = msg + ' Discovered ';
      this.projectService.setPortalRec(this.rawData.id, path, prtl);
    }
    this.projectService.setLogMsg(this.rawData.id,
      msg + ' ' + path, prtl);
    this.drawPortalFrame(prtl);
  }

  drawPortalFrame(prtl: PortalRec): void {
    if (prtl.status) {
      if (prtl.status === this.P_FULL) {
        this.drawFrame(prtl, '#FFFFFF', 6);

      } else if (prtl.status === this.P_NO_URL ||
        prtl.status === this.P_NO_NAME) {

        this.drawFrame(prtl, '#999999', 6);

      } else if (prtl.status === this.P_EMPTY) {

        this.drawFrame(prtl, '#333333', 6);
      }
    }
  }

  drawPortalFrames(): void {
    if (this.ctx && this.portalRecs) {
      this.portalRecs.forEach(prtl => {
        this.drawPortalFrame(prtl);
      });
    }
  }

  /*
  getLatestRawData(): void {
    this.rawDataDoc.get().subscribe(doc => {
      if (doc.exists) {
        // console.log('defaultRawData: ' + JSON.stringify(doc.data()));
        this.rawData = doc.data() as RawData;
        this.logger('In getLatestRawData - rawData name:' + this.rawData.name + ' id: ' + this.rawData.id);
        return true;
        // this.drawPortalFrames();
      } else {
        return false;
      }
    });
  }
   */

  /// Mouse Events ( after canvas initialized
  handleMouseDown(e): void {
    if (!this.busy) {
      this.busy = true;
      const xy = this.getXY(e);
      const x = xy[0];
      const y = xy[1];
      this.rawData.columns.forEach(column => {
        if (x > (column.offset - column.width) && x < column.offset) {
          column.portals.forEach(pr => {
            if ((y > pr.t && y < (pr.b + pr.t)) && (x < (pr.r + pr.l) && x > pr.l)) {
              let name = '';
              let url = '';
              let latLng = null;
              const path = column.name + ':' + pr.index;
              const prtl: PortalRec = this.portalRecs.find(p => p.index === pr.index && p.colName === column.name);
              let owner = '';
              if (prtl) {
                owner = prtl.owner ? prtl.owner : '';
                name = prtl.name;
                url = prtl.url;
                latLng = prtl.latLng;
              }
              const dlgData: PortalRec = {
                rawDataId: this.rawData.id,
                colName: column.name,
                user: this.ingressName,
                owner,
                index: pr.index, l: pr.l, r: pr.r, t: pr.t, b: pr.b,
                name,
                url,
                latLng,
              };
              let canOpen = true;
              if (this.projectService.clipboard && !latLng) {
                const src = this.projectService.clipboard.colName + ':' +
                  this.projectService.clipboard.index;
                const dest = dlgData.colName + ':' + dlgData.index;
                if (confirm('Do you want to PASTE:' + src + ' to ' + dest))
                {
                  canOpen = false;
                  dlgData.url = this.projectService.clipboard.url;
                  dlgData.latLng = this.projectService.clipboard.latLng;
                  dlgData.status = this.P_FULL;
                  // TODO At this point we can do auto paste;
                  // this.projectService.setLogMsg(this.rawData.id,
                  //  this.ingressName + ' discovered ' + dlgData.colName + ':' + dlgData.index);
                  this.projectService.setPortalRec(this.rawData.id, path, dlgData);
                  dlgData.owner = this.ingressName;
                  this.updatePortalRecs(dlgData);
                  this.projectService.setLogMsg(
                    this.rawData.id,
                    this.ingressName + ' Pasted ' + src + ' to ' + dest,
                    dlgData );
                } else {
                  canOpen = true;
                }
              }
              if (canOpen) {
                dlgData.msg = ''; // use msg to comunicate info within the dialog
                dlgData.rawDataId = this.rawData.id;
                dlgData.user = this.ingressName;
                this.openPortalDialog(dlgData); // send event to open dialog ???
                this.busy = false;
              }
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
    const testMsg = ''; // ' testing testing: Image dimensions: ' + this.width + ' x ' + this.height;

    const name = prompt('Please enter a Name' + testMsg, this.SavedIngressName);
    if (name && name !== '') {
      this.validated = true;
      this.ingressName = name;
      this.usersService.updateIngressName(name);
      this.expandMe = false;
      this.initCanvas();
      this.bannerInfo = '  @ ' + name + ' started working!' + this.bannerInfo;
      if (this.rawData) {
        this.projectService.setLogMsg( this.rawData.id,
          this.ingressName + ' Logged In', null);
      }
    }
  }

  get SavedIngressName(): string {
    let test: IngressNameData;
    if (this.allIngressNames) {
      // const found = array1.find(element => element > 10);
      test = this.allIngressNames.find((element => element.userUid === this.authService.user.uid));
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

  isDone(column: Column): boolean {
    const charId = '_CHAR:' + column.name;
    const test: ColumnChar = this.portalRecs.find(cr => cr.id === charId);
    console.log('ColumnChar: ' + JSON.stringify(test));
    if (test && test.final) {
      const name = this.allIngressNames.find((element => element.userUid === test.final.uuid));
      if (name) {
        return test.final.char.length > 0;
      }
    }
    return false;
  }

  showColumnInfo(column: Column): void {
    const portalCount = column.portals.length;
    const colRecData: ColumnRecData = {column, portalRecs: []};
    this.portalRecs.forEach(prtl => {
      if (column.name === prtl.colName) {
        colRecData.portalRecs.push(prtl);
      }
    });
    const charId = '_CHAR:' + column.name;
    let test: ColumnChar = this.portalRecs.find(cr => cr.id === charId);
    if (!test) {
      const unknown: any = {
        rawDataId: this.rawData.id, id: charId, guesses: '', final: '', portalCount};
      test = unknown as ColumnChar;
    }
    colRecData.columnChar = test;
    this.openMapDialog(colRecData);
  }

  isValidURL(url: string): boolean {
    return (-1 !== url.indexOf('https://intel.ingress.com/intel?', 0));
  }

  autoClosePortalDialog(data: PortalRec): void {
    const dialogRef = this.dialog.getDialogById(this.portalDialogRef.id);
    dialogRef.close(data);
  }

  openPortalDialog(dialogData: PortalRec): void {
    this.portalDialogRef = this.dialog.open(PortalInfoDialogComponent, {
      width: '540px',
      height: '540px',
      data: dialogData
    });

    this.portalDialogRef.afterClosed().subscribe(result => {

      if (result) {
        let status = 0;
        const dat = result as PortalRec;
        if (!dat.url && !dat.name) {
          // remove residual latLng
          dat.latLng = null;
          status = this.P_EMPTY;
        } else {
          // Name is optional
          if (!dat.name || dat.name.length === 0) {
            dat.name = '';
            status = this.P_NO_NAME;
          }
          // get the LatLng
          const latLng: LatLng = this.makeLatLng(dat.url);
          if (!latLng) {
            dat.latLng = null;
            status = this.P_NO_URL;
          } else {
            dat.latLng = latLng;
            status = this.P_FULL; // NOTE LatLng is all you need
          }
          if (status !== this.P_NO_NAME && status !== this.P_NO_URL) {
            status = this.P_FULL;
          }
        }
        dat.status = status;
        const path = dat.colName + ':' + dat.index;
        let prtl: PortalRec = this.portalRecs.find(p => p.index === dat.index && p.colName === dat.colName);
        if (!prtl) {
          prtl = {
            rawDataId: this.rawData.id,
            index: dat.index,
            user: this.ingressName,
            owner: this.ingressName,
            colName: dat.colName, l: dat.l, r: dat.r, t: dat.t, b: dat.b,
            status,
            name: dat.name,
            url: dat.url,
            latLng: dat.latLng,
          };
        } else {
          prtl.owner = this.ingressName;
          prtl.user = dat.user;
          prtl.name = dat.name;
          prtl.latLng = dat.latLng;
          prtl.url = dat.url;
          prtl.status = status;
        }
        this.projectService.setPortalRec(this.rawData.id, path, prtl);
        this.updatePortalRecs(prtl);
      } else {
      }
    });
  }

  openMapDialog(columnRecData: ColumnRecData): void {
    const dialogRef = this.dialog.open(MapDialogComponent, {
      width: '600px',
      // height: '800px',
      data: columnRecData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const colRecData: ColumnRecData = result;
        console.log('openMapDialog afterClose result: ' + JSON.stringify(colRecData.columnChar));
        // this.projectService.setCodeChar(colRecData.columnChar);
      } else {
      }
    });
  }

  private makeLatLng(url: string): LatLng {
    if (url) {
      const arr = url.split('?');
      const paramsString = arr[1];
      const searchParams = new URLSearchParams(paramsString);
      const ll = searchParams.get('ll');
      if (ll) {
        const arr2 = ll.split(',');
        return {lat: parseFloat(arr2[0]), lng: parseFloat(arr2[1])};
      }
    }
    return null;
  }

  msgLogClick(msgDat: MsgDat): void {
    alert(JSON.stringify(msgDat));
  }

  // store messgaes to a buffer to view on mobile etc.
  logger(msg: string): void {
    const date = JSON.stringify(new Date());
    this.logBuffer += ' ' + date + ': ' + msg;
  }

}


////////////////////////////////////////////////////////////////////////////
// TODO get this out here

@Component({
  selector: 'app-portal-info-dialog',
  templateUrl: 'portal-info-dialog.html',
})
export class PortalInfoDialogComponent {
  constructor(public dialogRef: MatDialogRef<PortalInfoDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: PortalRec,
              public projectService: ProjectService) {
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  // TODO this is not usefull right now could be usefull for standalone dialog component
  openIntelMap(data: PortalRec): void {
    if (data) {
      if (this.isValidURL(data.url)) {
        window.open(data.url, 'intel_map');
        // this.dialogRef.close();
        // TODO pixr could hang when a dialog is open too long - timeout maybe
      } else {
        alert(data.url + ' is not a valid intel url');
      }
    } else {
    }
  }

  openMissionTool(): void {
    window.open('https://missions.ingress.com/', 'mission_tool');
  }

  searchIntelMap(): void {
    window.open('https://intel.ingress.com/intel', 'intel_map');
  }

  isValidURL(url: string): boolean {
    return (-1 !== url.indexOf('https://intel.ingress.com/intel?', 0));
  }

  validateUrl(url: string, data: PortalRec): void {
    if (this.isValidURL(url)) {
      this.dialogRef.close(data);
    } else {
      data.msg = 'Not a Valid intel URL!';
    }
  }

  eraseData(data: PortalRec): void {
    if (confirm('Do you really wan to ERASE?')) {
      const msg = data.user + ' Erased ' + data.colName + ':' + data.index
          + ' owner: ' + data.owner;
      this.projectService.setLogMsg(data.rawDataId, msg, null);
      data.owner = '';
      data.latLng = null;
      data.url = '';
      this.dialogRef.close(data);
    }
  }

  setClipboard(data: PortalRec): void {
    this.projectService.clipboard = data;
    /*
    const name = prompt('Enter a name to identify clipboard object', '');
    if (name !== '') {
      data.name = name;
      this.projectService.clipboard = data;
      console.log('Clipboard: ' + this.projectService.clipboard);
    }else{
      alert('A name is required to identify the object you wish to paste!');
    }*/
  }

  clearAllMessages(data: PortalRec): void {
    if (data.user === 'G12mo'){
      if (confirm('CLEAR_ALL_MESSAGES')){
        this.projectService.setLogMsg(data.rawDataId, 'CLEAR_ALL_MESSAGES', data);
      }
    }
  }
}
