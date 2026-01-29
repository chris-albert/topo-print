declare module '@mapbox/vector-tile' {
  import Pbf from 'pbf';

  export class VectorTile {
    layers: Record<string, VectorTileLayer>;
    constructor(pbf: Pbf);
  }

  export class VectorTileLayer {
    length: number;
    name: string;
    feature(index: number): VectorTileFeature;
  }

  export class VectorTileFeature {
    type: number;
    extent: number;
    id: number;
    properties: Record<string, unknown>;
    toGeoJSON(x: number, y: number, z: number): GeoJSON.Feature;
  }
}
