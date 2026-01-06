<template>
	<div class="svg-icon icon-wrapper" :style="`font-size: ${fontSize}`">
		<svg
			class="icon"
			aria-hidden="true"
			:style="{
				color: color || 'currentColor',
				width: '1em',
				height: '1em'
			}"
		>
			<use :href="iconName"></use>
		</svg>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
	name: String,
	prefix: {
		type: String,
		default: "icon-"
	},
	color: String,
	size: String || Number
});
const iconName = computed(() => `#${props.prefix}${props.name}`);
const fontSize = props.size ? (isNaN(Number(props.size)) ? props.size : props.size + "px") : "";
</script>

<style lang="scss" scoped>
.icon-wrapper {
	display: flex;
	align-items: center;
	padding: 0;
	margin: 0;
	line-height: 1;
	vertical-align: middle;
}
.icon {
	width: 100%;
	height: 100%;
	overflow: hidden;
	vertical-align: middle;
	fill: currentColor;
}
</style>
