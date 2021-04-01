import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ProjectService} from '../services/project.service';
import {
  AdminList,
  BootParam,
  CharDat, Column,
  ColumnChar,
  ColumnRecData, GridItem,
  IngressNameData,
  LatLng,
  Messages,
  MetaData,
  MsgDat,
  PortalRec,
  RawData
} from '../project.data';
import {AngularFirestoreDocument} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import {UsersService} from '../services/users.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
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
  pageXOffset = 0;
  lastXOffset = 0;
  pageYOffset = 0;
  lastYOffset = 0;
  bannerLeft = 60;
  bannerLeftMargin = 60;
  logoutButtonWidth = 56;

  bannerWidth = 1024;
  width: number;
  height: number;
  bannerWidthO: number;
  widthO: number;
  heightO: number;
  /////////////////////////////////////  Zoom In Zoom Out ///////////////////
  is100 = true;
  is50 = false;
  is30 = false;
  scale = 1;


  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  /** Template reference to the canvas element */
  @ViewChild('canvasEl') canvasEl: ElementRef;
  @ViewChild('myImage') myImage: ElementRef;
  /** Canvas 2d context */
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;

  //////////////////////////  Hard Code ZONE Caution
  // TODO someday have an upload service for this
  // imgUrl = 'assets/FirstSatBlackSmall.jpg'; // 'assets/FirstSatBlack.jpg';
  // imgUrl: string; // assigned after project data aquired from Firebase
  src: string; // TODO make constants for = 'https://geopad.ca/fs_pics/' + folder + '/black.jpg';
  path = 'https://geopad.ca/fs_pics/';
  // realWidth = 4887;
  // realHeight = 2699;
  logBuffer = '';
  ///////////////////////////////////////////////////

  // Firestore data
  rawDataDoc: AngularFirestoreDocument;
  metaData: MetaData;
  rawData: RawData;
  portalRecs: PortalRec[];
  logMessages: Messages;
  logMsgArray: MsgDat[] = [];
  columnRecDataArray: ColumnRecData[]; // gathers all recData objects according to column
  colRecPrefix = '_ColRec:';
  dataReady = false; // After all columnRecData has been initialized

  // Banner Info
  bannerInfo = '  @ anonymous arrived!';
  // User information
  ingressName = '';
  ingressNamesDoc: AngularFirestoreDocument;
  allIngressNames: IngressNameData[];

  private portalDialogRef: MatDialogRef<PortalInfoDialogComponent, PortalRec>;
  validated = false; // After user sets ingress name set true and shoe images

  //////////////////////////// user info /////////////////////////////
  googleUID: string;
  isAdmin = false;
  adminList: AdminList;
  fsUser: BootParam;
  fsAdmin: BootParam;

  debugMsgs = 'START: ';
  imageLoaded = false;
  showDebug = true;
  waves = 'assets/waves.gif';

  lightumber = '#ffcc99';
  darkumber = '#cc9966';
  lightgrey = '#EEEEEE';
  grey = '#CCCCCC';
  mediumgrey = '#555555';
  darkgrey = '#333333';
  black = '#000000';
  nothing = 'transparent';

  maxPortals: number;
  gridList: GridItem[];
  isUpdate = false;

  constructor(public authService: AuthService,
              private projectService: ProjectService,
              private usersService: UsersService,
              public dialog: MatDialog) {
    this.rawData = {id: '', name: '', columns: []};
  }

  ngAfterViewInit(): void {
    this.getBootParams();
  }

  ngOnInit(): void {
    this.authService.afAuth.currentUser.then(value => {
      this.googleUID = value.uid;
      this.debugMsgs += value.displayName + 'Logged In, ';
    });
  }

  initPortalRec(column: Column, pr: PortalRec): PortalRec{
    let name = '';
    let url = '';
    let latLng = null;
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
      scale: this.scale,
    };
    return dlgData;
  }

  buildGridlist(): void {
    console.log('buildGridlist()');
    this.gridList = [];
    for ( let i = 1; i <= this.maxPortals; i++) {
      this.rawData.columns.forEach(col => {
        const id = col.name + ':' + i;
        const gridItem: GridItem = {
          id, color: this.nothing, prtlRec: null };

        const prtl = col.portals.find
          (pr => pr.colName === col.name && pr.index === i);
        if (prtl) {
          const prtlRec = this.initPortalRec(col, prtl);
          gridItem.prtlRec = prtlRec;
          if (prtlRec.latLng) {
            gridItem.color = this.lightgrey;
          } else {
              gridItem.color = this.grey;
          }
        } else {
          gridItem.id = null;
        }
        this.gridList.push(gridItem);
      });
    }
  }

  openIntelUrl(url: string): void {
    if (confirm('Open the intel map to: ' + url)){
      window.open(url, 'intel_map');
    }
  }

  buildColumnRecDataArray(): void {
    // BIG NO NO do not call more than once overloaded the backend
    // if (this.dataReady){ return; }
    // now we can initialize or get the column rec data
    this.columnRecDataArray = [];
    this.debugMsgs += 'rawData.columns length: ' + this.rawData.columns.length + ', ';
    this.maxPortals = 0;
    this.rawData.columns.forEach(column => {
      // Build the PortalRec[] for this column
      const portalRecs: PortalRec[] = [];
      this.maxPortals = column.portals.length > this.maxPortals ? column.portals.length : this.maxPortals;
      let portalCount = 0;
      column.portals.forEach(portal => {
        // get the portal rec for that
        const prtlRecId = column.name + ':' + portal.index;
        const test2 = this.portalRecs.find(
          prtlrec => prtlrec.colName + ':' + prtlrec.index === prtlRecId);
        if (test2) {
          if (test2.status === this.P_FULL) {
            portalCount++;
          }
          portalRecs.push(test2);
        } else {
          // add a starter
          const starter: PortalRec = {
            id: column.name + ':' + portal.index,
            index: portal.index,
            colName: column.name,
            rawDataId: this.rawData.id,
            user: '', owner: '',
            l: portal.l, t: portal.t, r: portal.r, b: portal.b
          };
          portalRecs.push(starter);
        }
      });
      const percentDone = Math.round(portalCount / column.portals.length * 100);
      let colRecData: ColumnRecData;
      const testColRec: any = this.portalRecs.find(prd => prd.id === this.colRecPrefix + column.name);
      if (testColRec) {
        // Find the corresponding ColumnRecData
        const unknown: any = this.portalRecs.find(clrDat => clrDat.id === this.colRecPrefix + column.name);
        if (unknown) {
          const temp = unknown as ColumnRecData;
          colRecData = {
            rawDataId: this.rawData.id, columnChar: temp.columnChar, id: temp.id,
          };
          colRecData.columnChar.portalCount = portalCount; // update the portal count
          colRecData.columnChar.percentDone = percentDone;
          colRecData.columnChar.portalsLength = column.portals.length;
        } else {
          console.log('unknown FAILED testColRec: ' + testColRec + ' at column: ' + column.name);
        }
      } else {
        // Update the backend db
        const final: CharDat = {char: '', time: '', ingressName: ''};
        let columnChar: ColumnChar;
        columnChar = {
          id: '_CHAR:' + column.name, // unique identifier _CHAR: then column names A to P...
          rawDataId: this.rawData.id,
          portalsLength: column.portals.length,
          notes: '', final, portalCount, percentDone
        };
        console.log('TESTING TESTING Database Update for Column: ' + column.name);
        // Add an empty ColumnRecData template
        const template = {
          rawDataId: this.rawData.id, columnChar, id: this.colRecPrefix + column.name,
        };
        this.projectService.setColumnRecData(template);
        // After updating firebase add the optional fields for passing data around
        colRecData = {
          rawDataId: this.rawData.id, columnChar, id: this.colRecPrefix + column.name,
          column: null, portalRecs: null, ingressName: ''
        };
      }
      // add the optional fields for passing data around
      const color = portalCount > 0 ? this.darkumber : this.lightumber;
      colRecData.backColor = color;
      colRecData.column = column;
      colRecData.portalRecs = portalRecs;
      colRecData.ingressName = this.ingressName;
      this.columnRecDataArray.push(colRecData);
      this.dataReady = true;
      this.bannerWidth = 128 * this.columnRecDataArray.length;
    });
    // console.log('TESTING TESTING DataReady');
    this.dataReady = true;
  }

  ///////////////  initialization helper methods //////////////////////
  subscribeToFsProject(id: string): void {
    // Subscribe to all the portalRec docs
    this.projectService.getPortalRecs(id).subscribe(data => {
      this.portalRecs = data.map(e => {
        return {
          id: e.payload.doc.id,
          ...e.payload.doc.data()
        } as PortalRec;
      });
      // Find the metadata
      const test = this.portalRecs.find(pr => pr.id === '_metadata');
      if (test) {
        const unknown: any = test;
        this.metaData = unknown as MetaData;
        this.rawData = this.metaData.rawData;
        this.debugMsgs += 'rawData name: ' + this.rawData.name + ', ';
        this.logger('In subscribeToFsProject - rawData name:' + this.rawData.name + ' id: ' + this.rawData.id);
        this.projectService.getMsgLog(id).get().subscribe(doc2 => {
          if (doc2.exists) {
            this.logMessages = doc2.data() as Messages;
            this.logMsgArray = this.logMessages.messages;
            this.debugMsgs += 'getMsgLog length: ' + this.logMsgArray.length + ', ';
          }
        });
        this.ingressNamesDoc = this.usersService.getUserDocs().subscribe(dat => {
          this.allIngressNames = dat.map(e => {
            return {
              id: e.payload.doc.id,
              ...e.payload.doc.data()
            } as string[];
          });
          this.debugMsgs += 'ingressNames length: ' + this.allIngressNames.length + ', ';
          this.buildColumnRecDataArray();
          this.buildGridlist();
        });
      }
    });
  }

  getBootParams(): void {
    // TODO add UI procedure for assigning admin status this.setAdmin('G12mo', '1KYU0BdE0rXTly5Y5KZslOvxpow2');
    this.projectService.bootParamsCollection.get().subscribe(data => {
      if (!data.empty) {
        const admlst = data.docs.find(d => d.id === 'admin_list');
        if (admlst) {
          this.adminList = admlst.data() as AdminList;
        }
        const usr = data.docs.find(d => d.id === 'fs_user');
        if (usr) {
          this.fsUser = usr.data() as BootParam;
        }
        const adm = data.docs.find(d => d.id === 'fs_admin');
        if (adm) {
          this.fsAdmin = adm.data() as BootParam;
        }
        const test = this.adminList.admins.find(a => a.uid === this.googleUID);
        this.isAdmin = !!test;
        let id; let folder;
        if (this.isAdmin) {
          id = this.fsAdmin.project_id;
          folder = this.fsAdmin.folder;
        } else {
          id = this.fsUser.project_id;
          folder = this.fsUser.folder;
        }
        this.src = this.path + folder + '/black.jpg';
        // TODO remove after local testing
        // this.src = 'assets/black.jpg';
        console.log('src = ' + this.src);
        // Once we have default project id we can subscribe
        // this.subscribeToRawdataFor(id); Deprecated
        this.debugMsgs += 'src: ' + this.src + ', ';
        this.subscribeToFsProject(id);
      }
    });
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
      this.projectService.updatePortalRec(this.rawData.id, path, prtl).then(() => {
        // this.buildGridlist();
      });
    } else {
      msg = msg + ' Discovered ';
      this.projectService.setPortalRec(this.rawData.id, path, prtl).then(() => {
        // this.buildGridlist();
      });
    }
    this.projectService.setLogMsg(this.rawData.id,
      msg + ' ' + path, prtl);
  }

  setIngressName(): void {
    const testMsg = ''; // ' testing testing: Image dimensions: ' + this.width + ' x ' + this.height;

    const name = prompt('Please enter a Name' + testMsg, this.SavedIngressName);
    if (name && name !== '') {
      this.validated = true;
      this.ingressName = name;
      this.usersService.updateIngressName(name);
      this.expandMe = false;
      this.bannerInfo = '  @ ' + name + ' started working!' + this.bannerInfo;
      if (this.rawData) {
        this.projectService.setLogMsg(this.rawData.id,
          this.ingressName + ' Logged In', null);
      }
      this.showDebug = false;
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

  showColumnInfo(columnRecData: ColumnRecData): void {
    // Pass the ingressName in to assign to ColumnChar.final if final Letter is picked
    // check to see if value for letter is being changed and change owner
    columnRecData.ingressName = this.ingressName;
    this.lastXOffset = this.pageXOffset;
    this.lastYOffset = this.pageYOffset;
    this.openMapDialog(columnRecData);
  }

  isValidURL(url: string): boolean {
    return (-1 !== url.indexOf('https://intel.ingress.com/intel?', 0));
  }

  openPortalDialog(dialogData: PortalRec): void {
    this.portalDialogRef = this.dialog.open(PortalInfoDialogComponent, {
      width: '600px',
      data: dialogData
    });

    this.portalDialogRef.afterOpened().subscribe(() => {
      console.log('portalDialogRef.afterOpened');
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

  clearAllMessages(): void {
    if (confirm('CLEAR_ALL_MESSAGES')) {
      this.projectService.clearLog(this.rawData.id);
    }
  }
}


////////////////////////////////////////////////////////////////////////////
// TODO get this outa here

@Component({
  selector: 'app-portal-info-dialog',
  templateUrl: 'portal-info-dialog.html',
})
export class PortalInfoDialogComponent {
  canvas: any;
  constructor(public dialogRef: MatDialogRef<PortalInfoDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: PortalRec,
              public projectService: ProjectService) {
  }

  onCancelClick(data: PortalRec): void {
    this.dialogRef.close();
  }

  openIntelMap(data: PortalRec): void {
    if (data) {
      if (this.isValidURL(data.url)) {
        window.open(data.url, 'intel_map');
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
    this.dialogRef.close(data);
  }

}
