"use script"

function init() {
  printVersion()
  // 判断webgl支持
  getWebGLInfo()
}

init()

function getWebGLInfo() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return 'WebGL not supported';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
    };
  } else {
    return 'WEBGL_debug_renderer_info extension not available';
  }
}

function printVersion() {
  console.log("✅ Cesium.js 版本:", Cesium.VERSION);
  console.log("✅ Turf.js 版本:", "7.2.0");
}