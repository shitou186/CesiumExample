export interface CatalogObject {
  name: string;
  icon?: string;
  children?: CatalogObject[];
  thumbnail?: string;
  main?: string;
  api?: string;
  details?: string;
  dev?: string;
  params?: string;
  jumpHref?: string;
  libs?: string[];
  resources?: string[];
  hasPannel?: boolean;
  download?: boolean;
  developerShow?: boolean;
  previewListIn?: boolean;
  hidden?: boolean;
  test?: boolean;
  new?: boolean;
  pannelFiles?: Record<string, Array<{ name: string; url: string }>>;
}
