const { injectManifest } = require('workbox-build');

const buildSW = () => {
  return injectManifest({
    swSrc: 'src/service-worker.ts',
    swDest: 'build/service-worker.js',
    globDirectory: 'build',
    globPatterns: [
      '**/*.{js,css,html,png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot,ico}',
    ],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  });
};

buildSW()
  .then(({ count, size }) => {
    console.log(`Generated service-worker.js, which will precache ${count} files, totaling ${size} bytes.`);
  })
  .catch((error) => {
    console.log('Service worker generation failed:', error);
  });