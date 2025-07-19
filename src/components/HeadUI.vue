<template>
    <a-flex :class="['topUI']" :justify="'center'" gap="middle">
        <a-button type="primary">Primary</a-button>
        <a-button type="primary">Primary</a-button>
        <a-button type="primary">Primary</a-button>
        <a-button type="primary">Primary</a-button>
        <a-space-compact>
            <a-button>CLICK-5</a-button>
            <a-button>CLICK-2</a-button>
            <a-button>CLICK-0</a-button>
            <a-button>CLICK-9</a-button>
        </a-space-compact>
    </a-flex>
</template>

<script setup lang="tsx">

</script>

<style lang="css" scoped>
.topUI {
    height: 100%;
    padding-top: 10px;
    pointer-events: auto;
}
</style>