import {Component, OnInit, AfterViewInit, ViewChild, Input} from '@angular/core';
import {} from 'googlemaps';
import {Column} from '../project.data';
import LatLng = google.maps.LatLng;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {

  @Input() column: Column;
  @ViewChild('map') mapElement: any;
  map: google.maps.Map;
  lastLatLng: LatLng;
  // bounds: LatLngBounds;
  private ottawaCenter: google.maps.LatLng;

  constructor() { }

  ngAfterViewInit(): void {
    this.initMap();
    console.log('Column: ' + JSON.stringify(this.column));
  }

  ngOnInit(): void {
  }

  initMap(): void {
    this.ottawaCenter = new google.maps.LatLng({lat: 45.42, lng: -75.7});
    const mapProperties = {
      // 45.38237717155323, -75.73928051704821
      center: new google.maps.LatLng(
        { lat: this.ottawaCenter.lat(), lng: this.ottawaCenter.lng()}),
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement,    mapProperties);
    this.drawMarkers();
  }

  drawMarkers(): void{
    this.column.portals.forEach(portal => {
      const latLng = portal.latLng;
      if (latLng) {
        const marker = new google.maps.Marker({
          position: latLng,
          title: portal.name,
          label: portal.index + '',
        });
        marker.setMap(this.map);
        if (this.lastLatLng) {
          // draw a line back to it
          const portalCoordinates = [
            { lat: latLng.lat, lng: latLng.lng },
            { lat: this.lastLatLng.lat(), lng: this.lastLatLng.lng() },
          ];
          const flightPath = new google.maps.Polyline({
            path: portalCoordinates,
            geodesic: false,
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 4,
          });
          flightPath.setMap(this.map);
        }
        // remember to assign a new value to this lastLatLng
        this.lastLatLng = new google.maps.LatLng(latLng);
      } else {
        // if the current portal has no latLng do not draw back to it
        this.lastLatLng = null;
      }
    });
    this.fitBounds();
  }

  fitBounds(): void {
    let count = 0;
    let singlton;
    const bounds = new google.maps.LatLngBounds();
    this.column.portals.forEach(portal => {
      if (portal.latLng) {
        if (count === 0) {singlton = portal.latLng; }
        count++;
        bounds.extend({lat: portal.latLng.lat, lng: portal.latLng.lng});
      }
    });
    if (count === 1) {
      this.map.setCenter(singlton);
    }
    else if (!bounds.isEmpty())
    {
      this.map.fitBounds(bounds);
    }
  }
}

