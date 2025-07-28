/// <reference types="vite/client" />

interface ImportMeta {
  /** Vite glob import, can be eager or lazy */
  readonly glob: <T = any>(
    pattern: string,
    opts?: { 
      /** load all matching modules immediately */ 
      eager?: boolean;
      /** choose whether to import as URL/raw/default */ 
      as?: 'url' | 'raw' | 'default';
    }
  ) => Record<string, T>;
}
