import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AuthService} from './auth.service';
import {IngressNameData} from '../project.data';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private firestore: AngularFirestore,
              private authService: AuthService) { }

  getUserDocs(): any{
    return this.firestore.collection('ingress_names').snapshotChanges();
  }

  updateIngressName(name: string): void {
    const uid = this.authService.user.uid;
    const ingNameData: IngressNameData = {id: uid, name};
    this.firestore.doc('ingress_names/' + uid).update(ingNameData).catch((reason) => {
      console.log(reason);
    });
  }


}
