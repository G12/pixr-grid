import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ColumnRecData} from '../../project.data';

@Component({
  selector: 'app-map-dialog',
  templateUrl: 'map-dialog.component.html',
})
export class MapDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<MapDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public columnRecData: ColumnRecData) {
  }

   onCancelClick(): void {
    this.dialogRef.close();
  }
}

