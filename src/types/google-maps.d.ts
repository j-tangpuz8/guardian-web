declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
  }

  class DirectionsService {
    route(request: DirectionsRequest, callback: (result: DirectionsResult, status: DirectionsStatus) => void): void;
  }

  class DirectionsRenderer {
    constructor(opts?: DirectionsRendererOptions);
    setMap(map: Map | null): void;
    setDirections(directions: DirectionsResult): void;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon | Symbol;
  }

  interface DirectionsRendererOptions {
    map?: Map;
    suppressMarkers?: boolean;
    polylineOptions?: PolylineOptions;
  }

  interface DirectionsRequest {
    origin: LatLng | LatLngLiteral | string;
    destination: LatLng | LatLngLiteral | string;
    travelMode: TravelMode;
  }

  interface DirectionsResult {
    routes: DirectionsRoute[];
  }

  interface DirectionsRoute {
    legs: DirectionsLeg[];
  }

  interface DirectionsLeg {
    distance: Distance;
    duration: Duration;
    start_address: string;
    end_address: string;
    start_location: LatLng;
    end_location: LatLng;
  }

  interface Distance {
    text: string;
    value: number;
  }

  interface Duration {
    text: string;
    value: number;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface Icon {
    path: string;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeWeight?: number;
    strokeColor?: string;
  }

  interface Symbol {
    path: SymbolPath;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeWeight?: number;
    strokeColor?: string;
  }

  enum SymbolPath {
    CIRCLE,
    BACKWARD_CLOSED_ARROW,
    FORWARD_CLOSED_ARROW,
    BACKWARD_OPEN_ARROW,
    FORWARD_OPEN_ARROW
  }

  enum TravelMode {
    DRIVING,
    WALKING,
    BICYCLING,
    TRANSIT
  }

  enum DirectionsStatus {
    OK,
    NOT_FOUND,
    ZERO_RESULTS,
    MAX_WAYPOINTS_EXCEEDED,
    INVALID_REQUEST,
    OVER_QUERY_LIMIT,
    REQUEST_DENIED,
    UNKNOWN_ERROR
  }

  interface PolylineOptions {
    strokeColor?: string;
    strokeWeight?: number;
  }
} 