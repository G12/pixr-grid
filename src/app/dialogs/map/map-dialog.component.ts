import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ColumnRecData} from '../../project.data';
import {ProjectService} from '../../services/project.service';

@Component({
  selector: 'app-map-dialog',
  templateUrl: 'map-dialog.component.html',
})
export class MapDialogComponent {
  portalCount = 0;
  constructor(
    public dialogRef: MatDialogRef<MapDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public columnRecData: ColumnRecData,
    public projectService: ProjectService) {
    this.portalCount = columnRecData.columnChar.portalCount;
  }

   onOkClick(result: ColumnRecData): void {
     if (result) {
       this.dialogRef.close();
       const colRecData: ColumnRecData = result;
       console.log('MapDialogComponent onOkClick result: ' + JSON.stringify(colRecData.columnChar));
       this.projectService.setCodeChar(colRecData.columnChar);
     } else {
       this.dialogRef.close();
     }
  }

  validateChar(columnRecData: ColumnRecData): void {

  }
}

