Vendored, unmodified files so barcode scanning works offline and without a CDN:

- `ponyfill.js`, `zxing-exported.js` from [barcode-detector](https://github.com/Sec-ant/barcode-detector) 3.2.2 (MIT, see LICENSE-barcode-detector)
- `zxing_reader.wasm` from [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) 3.1.3 (MIT, see LICENSE-zxing-wasm), a WebAssembly build of [zxing-cpp](https://github.com/zxing-cpp/zxing-cpp) (Apache-2.0)

Copied from the npm packages `barcode-detector@3.2.2` (`dist/es/`) and `zxing-wasm@3.1.3` (`dist/reader/`).
