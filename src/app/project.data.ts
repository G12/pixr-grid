
export interface PortalRec {
  colName: string;
  l: number;
  t: number;
  r: number;
  b: number;
  status?: string;
  name?: string;
  url?: string;
  user?: string;
}

export interface Column{
  name: string;
  offset: number;
  width: number;
  portals?: PortalRec[];
}

export interface RawData {
  id?: string;
  name?: string;
  columns?: Column[];
}

export interface PortalData {
  colName: string;
  x: number;
  y: number;
  x2: number;
  y2: number;
  name?: string;
  url?: string;
  discoverer?: string;
}

export interface ColumnData {
  name: string;
  width: number;
  offset: number;
  portals: PortalData[];
}

export interface CanvasData {
  imgUrl: string;
  srcHeight: number;
  srcWidth: number;
  displayWidth: number;
  displayHeight: number;
  columnCollection: ColumnData[];
}

/*
  "uid": "1KYU0BdE0rXTly5Y5KZslOvxpow2",
  "displayName": "Tom Wiegand",
  "photoURL": "https://lh3.googleusercontent.com/a-/AOh14GhUE1ZS-PPJZ3ygHR3bStggNLzwXttyRimxxr4y=s96-c",
  "email": "surrealranchhand@gmail.com",
 */
export interface ProjectUser {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export interface FirstSatProject {
  id?: string;
  name: string;
  date: string;
  projectUsers: ProjectUser[];
  canvasData: CanvasData;
}

// NOTE all fields are optional since firebase returns unknown TODO more research needed here
export interface BootParam {
  id?: string;
  project_id?: string;
  admin_list?: string[];
}

export interface BootParams {
  bootParams: BootParam[];
}

export interface IngressNameData {
  id: string;
  name: string;
}

export interface DialogData {
  name: string;
  url: string;
  rawData: RawData;
  col: Column;
  portal: PortalRec;
}
