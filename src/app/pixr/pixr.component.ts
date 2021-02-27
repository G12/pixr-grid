import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ProjectService} from '../services/project.service';
import {FirstSatProject, IngressNameData} from '../project.data';
import {AngularFirestoreDocument} from '@angular/fire/firestore';
import {AuthService} from '../services/auth.service';
import {UsersService} from '../services/users.service';

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

  canvas: HTMLCanvasElement;
  /** Template reference to the canvas element */
  @ViewChild('canvasEl') canvasEl: ElementRef;
  /** Canvas 2d context */
  private ctx: CanvasRenderingContext2D;
  img: any;
  imgUrl: string; // assigned after project data aquired from Firebase
  // Firestore data
  firstSatProjectDoc: AngularFirestoreDocument; // copied from project.service
  firstSatProject: FirstSatProject;

  // User information
  ingressName = '';
  ingressNamesDoc: AngularFirestoreDocument;
  allIngressNames: IngressNameData[];

  constructor(public authService: AuthService,
              private projectService: ProjectService,
              private usersService: UsersService) {
  }

  ///////////////  initialization helper methods //////////////////////
  subscribeToFirstSaturdayProj(id): void {
    this.firstSatProjectDoc = this.projectService.getfirstSatProjectDocRef(id);
    this.firstSatProjectDoc.get().subscribe(data => {
      if (data.exists) {
        console.log('defaultFirstSaturdayProj: ' + JSON.stringify(data.data()));
        this.firstSatProject = data.data();
        this.initImage(this.firstSatProject.canvasData.imgUrl);
      } else {
        // doc.data() will be undefined in this case
        console.log('No firstSatProjectDocRef!');
      }
    });
  }

  getIngressNameList(): void{
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
    // For client app first get image data from Firebase then
    // Get BootParam for fs_user then subscribe to default FirstSaturdayProj
    this.projectService.userBootParamDocRef.get().subscribe(data => {
      if (data.exists) {
        console.log('BootParam for fs_user: ' + JSON.stringify(data.data()));
        const userBootParam = data.data();
        const id = userBootParam.project_id;
        // Once we have default project id we can subscribe
        this.subscribeToFirstSaturdayProj(id);
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

  initImage(src): void {
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

  setIngressName(): void {
    const name = prompt('Please enter a Name', this.SavedIngressName);
    if (name && name !== '') {
      this.ingressName = name;
      this.usersService.updateIngressName(name);
      this.expandMe = false;
      this.drawCanvas();
    }
  }

  get SavedIngressName(): string{
    let test: IngressNameData;
    if (this.allIngressNames) {
      // const found = array1.find(element => element > 10);
      test  = this.allIngressNames.find( (element => element.id === this.authService.user.uid) );
    }
    return test ? test.name : '';
  }

}
