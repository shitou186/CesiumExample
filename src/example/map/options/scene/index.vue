<template>
  <Dialog title="Scene场景参数">
    <el-collapse v-model="activeName">
      <!-- 场景设置 -->
      <el-collapse-item title="场景设置" name="1">
        <el-form-item label="场景模式：">
          <el-select
            v-model="scene.mode"
            @change="handleChange('scene', 'scene', scene.mode)"
          >
            <el-option
              v-for="item in sceneOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="高动态渲染：">
          <el-radio-group
            v-model="scene.highDynamicRange"
            @change="
              handleChange('scene', 'highDynamicRange', scene.highDynamicRange)
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="快速抗锯齿：">
          <el-radio-group
            v-model="scene.fxaa"
            @change="handleChange('scene', 'fxaa', scene.fxaa)"
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示太阳：">
          <el-radio-group
            v-model="scene.sun"
            @change="handleChange('scene', 'sun', scene.sun)"
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示月亮：">
          <el-radio-group
            v-model="scene.moon"
            @change="handleChange('scene', 'moon', scene.moon)"
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示天空盒子：">
          <el-radio-group
            v-model="scene.skyBox"
            @change="handleChange('scene', 'skyBox', scene.skyBox)"
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="空间背景色：">
          <el-color-picker
            v-model="scene.backgroundColor"
            @change="
              handleChange('scene', 'backgroundColor', scene.backgroundColor)
            "
          />
        </el-form-item>
        <el-form-item label="雾化效果：">
          <el-radio-group
            v-model="scene.fog"
            @change="handleChange('scene', 'fog', scene.fog)"
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-collapse-item>
      <!-- 大气设置 -->
      <el-collapse-item title="大气设置" name="2">
        <el-form-item label="大气外光圈：">
          <el-radio-group
            v-model="scene.skyAtmosphere.show"
            @change="handleChange('skyAtmosphere', 'show', skyAtmosphere.show)"
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="绘制地面大气：">
          <el-radio-group
            v-model="scene.globe.showGroundAtmosphere"
            @change="
              handleChange(
                'globe',
                'showGroundAtmosphere',
                scene.globe.showGroundAtmosphere,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <div v-if="scene.globe.showGroundAtmosphere">
          <el-form-item label="光照强度：">
            <el-slider
              v-model="scene.globe.atmosphereLightIntensity"
              @change="
                handleChange(
                  'globe',
                  'atmosphereLightIntensity',
                  scene.globe.atmosphereLightIntensity,
                )
              "
            />
          </el-form-item>
          <el-form-item label="色相：">
            <el-slider
              v-model="scene.globe.atmosphereHueShift"
              :min="-1"
              :max="1"
              :step="0.1"
              @change="
                handleChange(
                  'globe',
                  'atmosphereHueShift',
                  scene.globe.atmosphereHueShift,
                )
              "
            />
          </el-form-item>
          <el-form-item label="饱和度：">
            <el-slider
              v-model="scene.globe.atmosphereSaturationShift"
              :min="-1"
              :max="1"
              :step="0.1"
              @change="
                handleChange(
                  'globe',
                  'atmosphereSaturationShift',
                  scene.globe.atmosphereSaturationShift,
                )
              "
            />
          </el-form-item>
          <el-form-item label="亮度：">
            <el-slider
              v-model="scene.globe.atmosphereBrightnessShift"
              :min="-1"
              :max="1"
              :step="0.1"
              @change="
                handleChange(
                  'globe',
                  'atmosphereBrightnessShift',
                  scene.globe.atmosphereBrightnessShift,
                )
              "
            />
          </el-form-item>
          <el-form-item label="瑞利散射系数(红)：">
            <el-slider
              v-model="scene.globe.atmosphereRayleighCoefficient.x"
              @change="
                handleChange(
                  'globe',
                  'atmosphereRayleighCoefficient-x',
                  scene.globe.atmosphereRayleighCoefficient.x,
                )
              "
            />
          </el-form-item>
          <el-form-item label="瑞利散射系数(绿)：">
            <el-slider
              v-model="scene.globe.atmosphereRayleighCoefficient.y"
              @change="
                handleChange(
                  'globe',
                  'atmosphereRayleighCoefficient-y',
                  scene.globe.atmosphereRayleighCoefficient.y,
                )
              "
            />
          </el-form-item>
          <el-form-item label="瑞利散射系数(蓝)：">
            <el-slider
              v-model="scene.globe.atmosphereRayleighCoefficient.z"
              @change="
                handleChange(
                  'globe',
                  'atmosphereRayleighCoefficient-z',
                  scene.globe.atmosphereRayleighCoefficient.z,
                )
              "
            />
          </el-form-item>
          <el-form-item label="瑞利散射高度：">
            <el-slider
              v-model="scene.globe.atmosphereRayleighScaleHeight"
              :min="100"
              :max="20000"
              :step="100"
              @change="
                handleChange(
                  'globe',
                  'atmosphereRayleighScaleHeight',
                  scene.globe.atmosphereRayleighScaleHeight,
                )
              "
            />
          </el-form-item>
          <el-form-item label="米氏散射系数：">
            <el-slider
              v-model="scene.globe.atmosphereMieCoefficient"
              :min="0"
              :max="100"
              :step="1"
              @change="
                handleChange(
                  'globe',
                  'atmosphereMieCoefficient',
                  scene.globe.atmosphereMieCoefficient,
                )
              "
            />
          </el-form-item>
          <el-form-item label="米氏散射高度：">
            <el-slider
              v-model="scene.globe.atmosphereMieScaleHeight"
              :min="100"
              :max="10000"
              :step="100"
              @change="
                handleChange(
                  'globe',
                  'atmosphereMieScaleHeight',
                  scene.globe.atmosphereMieScaleHeight,
                )
              "
            />
          </el-form-item>
          <el-form-item label="米氏散射各向异性：">
            <el-slider
              v-model="scene.globe.atmosphereMieAnisotropy"
              :min="-1"
              :max="1"
              :step="0.1"
              @change="
                handleChange(
                  'globe',
                  'atmosphereMieAnisotropy',
                  scene.globe.atmosphereMieAnisotropy,
                )
              "
            />
          </el-form-item>
        </div>
      </el-collapse-item>
      <!-- 地球Globe -->
      <el-collapse-item title="地球Globe" name="3">
        <el-form-item label="地形夸张倍数：">
          <el-slider
            v-model="scene.verticalExaggeration"
            :min="1"
            :max="100"
            :step="1"
            @change="
              handleChange(
                'scene',
                'verticalExaggeration',
                scene.verticalExaggeration,
              )
            "
          />
        </el-form-item>
        <el-form-item label="昼夜区域：">
          <el-radio-group
            v-model="scene.globe.enableLighting"
            @change="
              handleChange(
                'globe',
                'enableLighting',
                scene.globe.enableLighting,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="深度监测：">
          <el-radio-group
            v-model="scene.globe.depthTestAgainstTerrain"
            @change="
              handleChange(
                'globe',
                'depthTestAgainstTerrain',
                scene.globe.depthTestAgainstTerrain,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示底图：">
          <el-radio-group
            v-model="scene.globe.baseLayer"
            @change="handleChange('globe', 'baseLayer', scene.globe.baseLayer)"
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="地图背景色：">
          <el-color-picker
            v-model="scene.globe.baseColor"
            @change="handleChange('globe', 'baseColor', scene.globe.baseColor)"
          />
        </el-form-item>
      </el-collapse-item>
      <!-- 鼠标交互 -->
      <el-collapse-item title="鼠标交互" name="4">
        <el-form-item label="缩放地图：">
          <el-radio-group
            v-model="scene.screenSpaceCameraController.enableZoom"
            @change="
              handleChange(
                'scene',
                'enableZoom',
                scene.screenSpaceCameraController.enableZoom,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="倾斜相机(3D和2.5D)：">
          <el-radio-group
            v-model="scene.screenSpaceCameraController.enableTilt"
            @change="
              handleChange(
                'scene',
                'enableTilt',
                scene.screenSpaceCameraController.enableTilt,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="旋转转换位置(2D和3D)：">
          <el-radio-group
            v-model="scene.screenSpaceCameraController.enableRotate"
            @change="
              handleChange(
                'scene',
                'enableRotate',
                scene.screenSpaceCameraController.enableRotate,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="平移地图(2D和2.5D)：">
          <el-radio-group
            v-model="scene.screenSpaceCameraController.enableTranslate"
            @change="
              handleChange(
                'scene',
                'enableTranslate',
                scene.screenSpaceCameraController.enableTranslate,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="南北极绕轴心旋转：">
          <el-radio-group
            v-model="scene.camera.constrainedAxis"
            @change="
              handleChange(
                'scene',
                'constrainedAxis',
                scene.camera.constrainedAxis,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否进入地下：">
          <el-radio-group
            v-model="scene.enableCollisionDetection"
            @change="
              handleChange(
                'scene',
                'enableCollisionDetection',
                scene.enableCollisionDetection,
              )
            "
          >
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="最小碰撞高度：">
          <el-slider
            v-model="
              scene.screenSpaceCameraController.minimumCollisionTerrainHeight
            "
            :min="100"
            :max="500000"
            :step="100"
            @change="
              handleChange(
                'scene',
                'minimumCollisionTerrainHeight',
                scene.screenSpaceCameraController.minimumCollisionTerrainHeight,
              )
            "
          />
        </el-form-item>
        <el-form-item label="相机最近视距：">
          <el-slider
            v-model="scene.screenSpaceCameraController.minimumZoomDistance"
            :min="1"
            :max="10000"
            :step="10"
            @change="
              handleChange(
                'scene',
                'minimumZoomDistance',
                scene.screenSpaceCameraController.minimumZoomDistance,
              )
            "
          />
        </el-form-item>
        <el-form-item label="相机最远视距：">
          <el-slider
            v-model="scene.screenSpaceCameraController.maximumZoomDistance"
            :min="10000"
            :max="90000000"
            :step="10000"
            @change="
              handleChange(
                'scene',
                'maximumZoomDistance',
                scene.screenSpaceCameraController.maximumZoomDistance,
              )
            "
          />
        </el-form-item>
        <el-form-item label="滚轮放大倍数：">
          <el-slider
            v-model="scene.screenSpaceCameraController.zoomFactor"
            :min="1"
            :max="10"
            :step="1"
            @change="
              handleChange(
                'scene',
                'zoomFactor',
                scene.screenSpaceCameraController.zoomFactor,
              )
            "
          />
        </el-form-item>
      </el-collapse-item>
    </el-collapse>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";
import Dialog from "@/components/dialog/index.vue";
const activeName = ref("1");
const sceneOptions = [
  { value: 1, label: "哥伦布视图(2.5D)" },
  { value: 2, label: "2D模式" },
  { value: 3, label: "3D模式" },
];

const scene = ref({
  mode: 3,
  highDynamicRange: false,
  fxaa: true,
  sun: true,
  moon: true,
  skyBox: true,
  backgroundColor: "#2c8aeb",
  fog: true,
  skyAtmosphere: { show: true },
  globe: {
    showGroundAtmosphere: true,
    atmosphereLightIntensity: 10,
    atmosphereHueShift: 0,
    atmosphereSaturationShift: 0,
    atmosphereBrightnessShift: 0,
    atmosphereRayleighCoefficient: {
      x: 0,
      y: 0,
      z: 0,
    },
    atmosphereRayleighScaleHeight: 10000,
    atmosphereMieCoefficient: 1,
    atmosphereMieScaleHeight: 3200,
    atmosphereMieAnisotropy: 0.9,
    enableLighting: false,
    depthTestAgainstTerrain: false,
    baseColor: "#000000",
    baseLayer: true,
  },
  verticalExaggeration: 1,
  screenSpaceCameraController: {
    enableZoom: true,
    enableTilt: true,
    enableRotate: true,
    enableTranslate: true,
    minimumCollisionTerrainHeight: 15000,
    minimumZoomDistance: 1,
    maximumZoomDistance: 50000000,
    zoomFactor: 3,
  },
  enableCollisionDetection: true,
  camera: {
    constrainedAxis: true,
  },
});

const skyAtmosphere = ref({
  show: true,
});

const mouse = ref({
  intensity: 1,
});

function handleChange(type, key, value) {
  switch (type) {
    case "scene":
      window.mapWork.changeScene(key, value);
      break;
    case "skyAtmosphere":
      window.mapWork.changeSkyAtmosphere(key, value);
      break;
    case "globe":
      window.mapWork.changeGlobe(key, value);
      break;
    default:
      break;
  }
}
</script>

<style lang="scss">
.el-collapse-item__title {
  font-size: 14px;
  font-weight: bold;
}
</style>
