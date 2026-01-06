export interface CatalogObject {
  name: string;
  icon: string;
  download?: boolean;
  developerShow?: boolean;
  children: Child2[];
  dev?: string;
  test?: boolean;
}

interface Child2 {
  name: string;
  details?: string;
  children: (Child | Children2 | Children3 | Children4 | Children5 | Children6 | Children7 | Children8 | Children9 | Children10 | Children11)[];
  developerShow?: boolean;
  dev?: string;
  download?: boolean;
}

interface Children11 {
  name: string;
  thumbnail: string;
  main: string;
  api?: string;
  hasPannel: boolean;
  details?: string;
  download?: boolean;
  libs?: string[];
  developerShow?: boolean;
}

interface Children10 {
  name: string;
  thumbnail: string;
  main: string;
  api?: string;
  hasPannel?: boolean;
  libs?: string[];
  developerShow?: boolean;
  resources?: string[];
}

interface Children9 {
  name: string;
  thumbnail: string;
  main: string;
  api: string;
  hasPannel?: boolean;
}

interface Children8 {
  name: string;
  thumbnail: string;
  main: string;
  api?: string;
  hasPannel?: boolean;
  developerShow?: boolean;
  resources?: string[];
  params?: string;
  libs?: string[];
  download?: boolean;
}

interface Children7 {
  name: string;
  thumbnail: string;
  main: string;
  hasPannel?: boolean;
  pannelFiles?: PannelFiles;
}

interface PannelFiles {
  react: React[];
}

interface React {
  name: string;
  url: string;
}

interface Children6 {
  name: string;
  thumbnail: string;
  main: string;
  api: string;
  params?: string;
  hasPannel?: boolean;
  developerShow?: boolean;
  resources?: string[];
  download?: boolean;
  previewListIn?: boolean;
  libs?: string[];
}

interface Children5 {
  name: string;
  thumbnail: string;
  main: string;
  api?: string;
  hasPannel?: boolean;
  resources?: string[];
  details?: string;
  developerShow?: boolean;
  download?: boolean;
}

interface Children4 {
  name: string;
  thumbnail: string;
  main: string;
  api?: string;
  hasPannel?: boolean;
  resources?: string[];
  libs?: string[];
}

interface Children3 {
  name: string;
  thumbnail: string;
  main: string;
  api: string;
  hasPannel?: boolean;
  developerShow?: boolean;
  libs?: string[];
}

interface Children2 {
  name: string;
  thumbnail: string;
  main: string;
  api?: string;
  hasPannel: boolean;
  resources?: string[];
  hidden?: boolean;
}

interface Child {
  name: string;
  thumbnail: string;
  main: string;
  hasPannel?: boolean;
  api?: string;
  libs?: string[];
  resources?: string[];
  download?: boolean;
  developerShow?: boolean;
  hidden?: boolean;
  params?: string;
  previewListIn?: boolean;
  jumpHref?: string;
  new?: boolean;
}