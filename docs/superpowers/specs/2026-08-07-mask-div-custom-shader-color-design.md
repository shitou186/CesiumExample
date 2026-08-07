# Mask DIV Custom Shader Color Parameter

## Goal

Allow `customShader2` in the mask-div example to receive a `Cesium.Color` and use it as the base color for the height gradient and animated glow.

## Interface

```js
customShader2(tileset, color = Cesium.Color.CYAN)
```

The caller may pass any `Cesium.Color`, including a value created with `Cesium.Color.fromCssColorString`.

## Shader Data Flow

The JavaScript color is converted to a three-component value and declared as a `CustomShader` `VEC3` uniform named `u_baseColor`. The fragment shader multiplies this uniform by the existing height-dependent brightness and animated glow factors. No color values are interpolated into the GLSL source string.

The default color is cyan so existing callers retain the current visual intent. The example call passes an explicit CSS-derived color to demonstrate the API.

## Error Handling

The function expects a valid `Cesium.Color`. Cesium's `CustomShader` uniform validation remains responsible for rejecting invalid values; no additional conversion formats are introduced.

## Verification

- A regression test verifies that `customShader2` accepts a color parameter.
- A regression test verifies that the shader declares and uses `u_baseColor` instead of a hard-coded RGB value.
- Existing height-axis and shader-binding-order tests remain green.
- The complete Node test suite and production build pass.

## Scope

This change does not add a color picker, change the 3D Tiles URL, alter mask rendering, or add automatic runtime color animation.
