<template>
    <div class="ui">
        <a-config-provider :theme="theme">
            <a-layout style="background-color: transparent;">
                <a-layout-header :class="['header']">
                    <HeadUI />
                </a-layout-header>
                <a-layout :hasSider="true" style="background-color: transparent;">
                    <a-layout-sider collapsible defaultCollapsed :collapsedWidth="0" width="300"
                        :zeroWidthTriggerStyle="{ top: '5px' }" :class="['clickable', 'sider']" :theme="'light'"
                        @collapse="changeFlag">
                        <SideCard v-if="cardFlag" />
                    </a-layout-sider>
                </a-layout>
            </a-layout>
        </a-config-provider>
    </div>
    <div class="canvas">
        <Graph />
    </div>

</template>

<script setup lang="ts">
import Graph from './components/Graph.vue';
import SideCard from './components/SideCard.vue'
import HeadUI from './components/HeadUI.vue';
import { ref } from 'vue';

const theme = {
    token: {
        colorPrimary: "#00ba7d",
        colorWarning: "#fac714",
        fontSize: 16,
        borderRadius: 4,
        wireframe: false
    }
}

const cardFlag = ref<boolean>(false)

const changeFlag = (collapsed: boolean, type: string) => {
    if(collapsed){
        cardFlag.value = !collapsed;
    }else setTimeout(() => {
        cardFlag.value = !collapsed;
    }, 100);
}

</script>

<style scoped>
.ui {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    pointer-events: none;
}

.canvas {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    /* 叠放顺序 */
}

.clickable {
    pointer-events: auto;
}

.header {
    height: 50px;
    margin-bottom: 20px;
    background-color: transparent;
}

.contentUI {
    min-height: 70vh;
    background-color: transparent;
}

.sider {
    width: 20vw;
}
</style>