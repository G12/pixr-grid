import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MaterialModule} from './modules/material.module';
import {PixrComponent, PortalInfoDialogComponent} from './pixr/pixr.component';
import {FormsModule} from '@angular/forms';
import { MapDialogComponent } from './dialogs/map/map-dialog.component';
import {MapComponent} from './map/map.component';
import { SpeedDialComponent } from './components/speed-dial/speed-dial.component';

@NgModule({
  declarations: [
    AppComponent,
    PixrComponent,
    PortalInfoDialogComponent,
    MapDialogComponent,
    MapComponent,
    SpeedDialComponent
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    // AgmCoreModule.forRoot({
    //  apiKey: environment.googleMapsApiKey,
    //  libraries: ['geometry']
    // }),
  ],
  entryComponents: [
    PortalInfoDialogComponent,
    MapDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
