import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ProjectService} from '../../services/project.service';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.css']
})
export class ExportComponent implements OnInit, AfterViewInit {

  textArea: HTMLTextAreaElement;
  @ViewChild('txtEl') txtEl: ElementRef;
  done = false;
  content: string[];

  constructor(public dialogRef: MatDialogRef<ExportComponent>,
              @Inject(MAT_DIALOG_DATA) public data: string[],
              public projectService: ProjectService) {

  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.textArea = this.txtEl.nativeElement;
    this.textArea.value = '';
    this.data.forEach(value => {
      this.textArea.value += value;
    });
  }

  onOkClick(): void {
    this.dialogRef.close();
  }
}
