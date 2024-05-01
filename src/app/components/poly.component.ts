import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import GeoJSON from 'geojson';
import { ExtrudeMode } from './interfaces';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'poly',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './poly.template.html',
  styleUrls: ['./poly.style.scss', './map.style.scss'],
})
export class PolyComponent implements OnInit {
  constructor() {}

  form: FormGroup = new FormGroup({
    heightInput: new FormControl('', Validators.pattern('^[0-9]*$')),
  });

  draw: MapboxDraw;
  map: mapboxgl.Map;
  extrudingArea: GeoJSON.FeatureCollection;
  layers: string[] = [];
  selectedLayer;

  extrudePolygon() {
    var notContainErrors = this.form.controls['heightInput'].errors == null;
    if (notContainErrors) {
      let height = this.form.controls['heightInput'].value;
      this.setHeight(+height);

      if (this.map.getPitch() < 30) {
        this.map.setPitch(30);
      }

      let sourceId = this.extrudingArea.features[0].id + '';
      var isExist = this.map.getSource(sourceId);

      if (isExist) {
        this.map.setPaintProperty(sourceId, 'fill-extrusion-height', +height);
      } else {
        this.addLayer(sourceId);
      }
    }
  }

  addLayer(sourceId) {
    this.map.addSource(sourceId, {
      type: 'geojson',
      data: this.extrudingArea,
    });
    this.map.addLayer({
      id: sourceId,
      type: 'fill-extrusion',
      source: sourceId,
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'base_height'],
        'fill-extrusion-opacity': 0.7,
      },
    });
    this.layers.push(sourceId);
  }

  getExtrudeMode() {
    var that = this;
    var extrudeMode: ExtrudeMode = {};

    extrudeMode.onSetup = function (opts) {
      var state = { count: 0 };
      state.count = opts.count || 0;
      return state;
    };

    extrudeMode.onClick = function (state, e) {
      that.disableSelection(e);

      if (e.featureTarget) {
        let coordinates = e.featureTarget._geometry.coordinates;
        let id = e.featureTarget.properties.id + '_source_id';
        var isExist = that.map.getSource(id);

        if (coordinates[0].length >= 4) {
          that.extrudingArea = that.getExtrudeArea(coordinates, id);
        }
        if (isExist && that.selectedLayer != id) {
          that.map.setPaintProperty(
            that.selectedLayer,
            'fill-extrusion-color',
            'aliceblue'
          );
          that.map.setPaintProperty(id, 'fill-extrusion-color', 'red');
          that.selectedLayer = id;
        }
      }
    };

    extrudeMode.toDisplayFeatures = function (state, geojson, display) {
      display(geojson);
    };

    return extrudeMode;
  }

  disableSelection(e) {
    const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
      [e.point.x - 5, e.point.y - 5],
      [e.point.x + 5, e.point.y + 5],
    ];
    const selectedFeatures = this.map.queryRenderedFeatures(bbox);

    var onlyAddedLayers = selectedFeatures.filter(
      (val) => val.layer.id.indexOf('_source_id') != -1
    );

    if (onlyAddedLayers.length == 0) {
      this.layers.forEach((str) => {
        this.map.setPaintProperty(str, 'fill-extrusion-color', 'aliceblue');
      });
    }
  }

  getExtrudeArea(coordinates, id): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            level: 1,
            name: 'extrudingPolygon',
            height: 150,
            base_height: 0,
            color: 'aliceblue',
          },
          geometry: {
            coordinates,
            type: 'Polygon',
          },
          id: id,
        },
      ],
    };
  }

  setHeight(height) {
    this.extrudingArea.features[0].properties['height'] = height;
  }

  deleteLayer() {
    this.map.removeLayer(this.selectedLayer);
    var idx = this.layers.indexOf(this.selectedLayer);
    this.layers.splice(idx, 1);
    this.selectedLayer = null;
  }

  extrudeMode() {
    this.draw.changeMode('extrudeMode');
    this.setExtrudeCursor();
  }

  lineMode() {
    this.draw.changeMode('draw_polygon');
    this.setDefaultCursor();
  }

  freeMode() {
    this.draw.changeMode('simple_select');
    this.setDefaultCursor();
  }

  trashMode() {
    this.draw.trash();
    this.setDefaultCursor();
  }

  setExtrudeCursor() {
    this.map.getCanvas().style.cursor = 'pointer';
  }

  setDefaultCursor() {
    this.map.getCanvas().style.cursor = 'default';
    this.extrudingArea = null;
  }

  ngOnInit(): void {
    this.map = new mapboxgl.Map({
      accessToken:
        'pk.eyJ1IjoibWFyb29uZWRpb25lIiwiYSI6ImNqdmp0MzB1azBpcDAzem1naHZwMjNndGIifQ.65nvvRg9QeFUV2c6b9W4Vw',
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-87.61694, 41.86625],
      zoom: 15.99,
      pitch: 40,
      bearing: 20,
      antialias: true,
    });

    var extrudeMode = this.getExtrudeMode();

    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      defaultMode: 'extrudeMode',
      modes: Object.assign(
        {
          extrudeMode: extrudeMode,
        },
        MapboxDraw.modes
      ),
    });

    this.map.addControl(this.draw, 'top-left');
  }
}
