import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ColumnRecData} from '../../project.data';
import {ProjectService} from '../../services/project.service';

@Component({
  selector: 'app-map-dialog',
  templateUrl: 'map-dialog.component.html',
})
export class MapDialogComponent {
  final = '';
  guesses = '';
  constructor(
    public dialogRef: MatDialogRef<MapDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public columnRecData: ColumnRecData,
    public projectService: ProjectService) {
      if (columnRecData.columnChar.final) {
        this.final = columnRecData.columnChar.final.char;
      }
      if (columnRecData.columnChar.guesses) {
        this.guesses = columnRecData.columnChar.guesses;
      }
  }

   onOkClick(result: ColumnRecData): void {
     if (result) {
       const template: ColumnRecData = {
         rawDataId: result.rawDataId,
         id: result.id,
         columnChar: result.columnChar,
       };
       if (this.final !== result.columnChar.final.char)
       {
         template.columnChar.final.char = this.final;
         template.columnChar.final.ingressName = result.ingressName;
         template.columnChar.final.time = JSON.stringify(new Date());
       }
       if (this.guesses !== result.columnChar.guesses){
         template.columnChar.guesses = this.guesses;
       }
       this.dialogRef.close();
       this.projectService.setColumnRecData(template);
     } else {
       this.dialogRef.close();
     }
  }

  validateChar(columnRecData: ColumnRecData): void {
    const test = columnRecData;
  }
}

