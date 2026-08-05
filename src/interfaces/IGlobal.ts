export interface Url {
  title: string;
  url: string;
}

export interface Server {
  title: string;
  serverId: string;
  href?: string;
}

export interface Quality {
  title: string;
  size?: string;
  urls?: Url[];
  serverList?: Server[];
}

export interface Format {
  title: string;
  qualities: Quality[];
}

/** Metadata sebuah parameter yang ditampilkan pada halaman dokumentasi. */
interface ParamValue {
  type: string;
  default: string | number | boolean;
  required: boolean;
}

export interface QueryParam {
  key: string;
  value: ParamValue;
}

export interface RouteParam {
  placeholder: string;
  value: ParamValue;
}

export interface RouteView {
  title: string;
  route: string;
  routeParams?: RouteParam[];
  queryParams?: QueryParam[];
}

export interface AnimeSource {
  title: string;
  baseUrl: string;
  baseUrlPath: string;
  message: string;
  ok: boolean;
  routesView: RouteView[];
}
