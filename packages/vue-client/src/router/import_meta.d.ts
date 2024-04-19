// Just augments vite's ImportMeta

interface ImportMeta {
  env: {
    BASE_URL: string;
  };
}
