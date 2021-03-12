import {Injectable} from '@angular/core';
import {
  BootParam,
  FirstSatProject,
  IngressNameData,
  PortalRec,
  ProjectUser,
  RawData,
  Messages,
  MsgDat,
  ColumnChar
} from '../project.data';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Action, DocumentSnapshot} from '@angular/fire/firestore/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  projectUser: ProjectUser = {
    uid: '',
    displayName: '',
    photoURL: '',
    email: '',
  };

  firstSatProject: FirstSatProject = {
    name: 'FS TEST Project',
    date: '2021-02-26',
    projectUsers: null,
    canvasData: null,
  };

  // NEW March 8 2021
  public clipboard: PortalRec;
  projectUsers: ProjectUser[] = [];

  projectId: string;
  rawDataId: string;

  // Boot parameters used to determine program flow
  fsAdmin: BootParam;
  fsUser: BootParam;

  userBootParamDocRef: AngularFirestoreDocument;
  adminBootParamDocRef: AngularFirestoreDocument;
  firstSatProjectDocRef: AngularFirestoreDocument;
  rawDataDocRef: AngularFirestoreDocument;

  constructor(private firestore: AngularFirestore) {
    // this.columnData.portals = this.portals;
    // this.canvasData.columnCollection = this.columnCollection;
    // this.firstSatProject.canvasData = this.canvasData;
    this.firstSatProject.projectUsers = this.projectUsers;

    // get a reference to the AngularFirestoreDocuments
    this.userBootParamDocRef = this.firestore.collection('fs_boot_params').doc('fs_user');
    this.adminBootParamDocRef = this.firestore.collection('fs_boot_params').doc('fs_admin');
    ///////////////////////////   Boot Up  //////////////////////////

  }

  /////////////////////////////  User data  ////////////////////////////
  setIngressName(name: string, userUid: string): void{
    const data: IngressNameData = {name, userUid};
    this.firestore.collection('ingress_names').add(data);
  }

  ////////////////// disparate PortalRecCollection objects //////////////
  setCodeChar(columnChar: ColumnChar): void{
    console.log('setCodeChar ColumnChar: ' + JSON.stringify(columnChar));
    // if (true) {return; }
    this.firestore.collection(columnChar.rawDataId).doc(columnChar.id).set(columnChar).then(value => {
      // console.log('setportal return value: ' + JSON.stringify(value));
    }).catch(reason => {
      console.log('setPortal ERROR reason: ' + JSON.stringify(reason));
    });
  }

  setLogMsg(rawDatId: string, msg: string, prtlRec: PortalRec): void{
    this.firestore.collection(rawDatId).doc('_MsgLog').get().subscribe(document => {
      const time = JSON.stringify(new Date());
      let id = '';
      if (prtlRec) { id = prtlRec.colName + ':' + prtlRec.index; }
      const msgDat: MsgDat = {msg, time, prtlId: id };
      let messagesDoc: Messages;
      if (msg === 'CLEAR_ALL_MESSAGES') {
        messagesDoc = {messages: []};
        // Send a user friendly message
        const usrName = prtlRec ? prtlRec.user : '';
        msgDat.msg = usrName + ' Cleared the Log!';
      } else if (document.exists){
        messagesDoc = document.data() as Messages;
      } else {
        messagesDoc = {messages: []};
      }
      messagesDoc.messages.unshift(msgDat);
      this.firestore.collection(rawDatId).doc('_MsgLog').set(messagesDoc).then(doc => {
        // console.log('setLogMsg return value: ' + JSON.stringify(doc));
      }).catch(reason => {
        console.log('setLogMsg ERROR reason: ' + JSON.stringify(reason));
      });
    });
  }

  //////////////////////////// PortalRecCollection  /////////////////////
  updatePortalRec(rawDatId: string, path: string, portalRec: PortalRec): void{
    this.firestore.collection(rawDatId).doc(path).update(portalRec);
  }

  getPortalRecs(path: string): any{
    return this.firestore.collection(path).snapshotChanges();
  }

  setPortalRec(rawDatId: string, path: string, portalRec: PortalRec): void{
    this.firestore.collection(rawDatId).doc(path).set(portalRec).then(value => {
      // console.log('setportal return value: ' + JSON.stringify(value));
    }).catch(reason => {
      console.log('setPortal ERROR reason: ' + JSON.stringify(reason));
    });
  }

  getMsgLog(rawDatId: string): AngularFirestoreDocument{
    return this.firestore.collection(rawDatId).doc('_MsgLog');
    // this.rawDataDocRef = this.firestore.collection(rawDatId).doc('_MsgLog');
    // return this.rawDataDocRef;
  }


  /* getfirstSatProjectDocRef(projectId): AngularFirestoreDocument{
    this.firstSatProjectDocRef = this.firestore.collection('first_sat_projects').doc(projectId);
    return this.firstSatProjectDocRef;
  }
   */

  getRawDataDocRef(projectId): AngularFirestoreDocument{
    this.rawDataDocRef = this.firestore.collection('raw_data_projects').doc(projectId);
    return this.rawDataDocRef;
  }

  ////////////////////////////  first_sat_projects //////////////////////

  addProject(project: FirstSatProject): void {
    this.firestore.collection('first_sat_projects').add(project).then((docref) => {
      this.projectId = docref.id;
      this.firestore.collection('project_ids').doc(docref.id).set(
        {name: project.name, type: 'first_sat', date: project.date})
        .then(ref => {
        }).catch(reason => {
        console.log('project_ids set ERROR:');
        console.log(reason);
      });
    }).catch((reason) => {
      console.log('first_sat_projects add ERROR:');
      console.log(reason);
    });
  }

  getProjectId(): string {
    return this.projectId;
  }

  getFirstSatProjectDocs(): any{
    return this.firestore.collection('first_sat_projects').snapshotChanges();
  }

  addFirstSatProjectAysinc(firstSatProject: FirstSatProject): Promise<any>{
    return this.firestore.collection('first_sat_projects').add(firstSatProject).then();
  }

  updateFirstSatProject(firstSatProject: FirstSatProject): void {
    // delete project.id;
    this.firestore.doc('first_sat_projects/' + firstSatProject.id).update(firstSatProject).catch((reason) => {
      console.log(reason);
    });
  }

  // tslint:disable-next-line:variable-name
  updateUserProjectId(project_id: string): void {
    const projId = {project_id};
    this.firestore.doc('fs_boot_params/fs_user').update(projId).catch((reason) => {
      console.log(reason);
    });
  }

  /////////////////// Raw Data methods /////////////////////////////////////////////////
  getRawDataDocs(): any{
    return this.firestore.collection('raw_data_projects').snapshotChanges();
  }

  getRawDataSnapshotChanges(id: string): Observable<Action<DocumentSnapshot<RawData>>> {
    return this.firestore.doc<RawData>('raw_data_projects/' + id).snapshotChanges();
  }

  addRawDataProjectAysinc(rawData: RawData): Promise<any>{
    return this.firestore.collection('raw_data_projects').add(rawData).then();
  }

  addRawDataProject(rawData: RawData): void {
    this.firestore.collection('raw_data_projects').add(rawData).then((docref) => {
      this.rawDataId = docref.id;
      rawData.id = docref.id;
      this.updateRawDataProject(rawData);
    }).catch((reason) => {
      console.log('raw_data_projects add ERROR:');
      console.log(reason);
    });
  }

  updateRawDataProject(rawData: RawData): void {
    // delete project.id;
    this.firestore.doc('raw_data_projects/' + rawData.id).update(rawData).catch((reason) => {
      console.log(reason);
    });
  }


  /////////////////// Prototyping Code ////////////////////////////

  /*
  get CanvasData(): CanvasData {
    return this.canvasData;
  }

  makeTestData(): void {
    this.canvasData = {
      columnCollection: [],
      imgUrl: '', srcHeight: 3300, srcWidth: 7000, displayWidth: 4890
    };

    const offsets = [269, 576, 907, 1157, 1499, 1795, 2139, 2460,
      2750, 3100, 3366, 3625, 3918, 4260, 4581, 4865];
    let last = 0;
    const widths: number[] = [];
    for (let i = 0; i < offsets.length; i++) {
      const char = String.fromCharCode(65 + i);
      widths[i] = (offsets[i] - last - 2);
      const column: ColumnData =
        {
          width: widths[i],
          offset: offsets[i],
          name: char,
          portals: []
        };
      this.canvasData.columnCollection.push(column);
      last = offsets[i];
    }
  }

  getCanvasDataSlowly(): Promise<CanvasData> {
    this.makeTestData();
    return new Promise(resolve => {
      // Simulate server latency with 2 second delay
      setTimeout(() => resolve(this.CanvasData), 2000);
    });
  }
   */
}
