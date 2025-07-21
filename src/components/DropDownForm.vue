<template>
    <a-dropdown :open="dropdownVisible" @openChange="handleVisibleChange" :trigger="['click']" placement="bottom">
        <a-button type="primary" shape="round" @click.prevent>
            {{ label }}
        </a-button>
        <!-- 下拉内容：表单 -->
        <template #overlay>
            <slot></slot>
        </template>
    </a-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const dropdownVisible = ref(false);

defineProps({
    label: {
        type: String,
        required: true,
    }
});

defineExpose({
    handleVisibleChange,
});
function handleVisibleChange(visible: boolean) {
    dropdownVisible.value = visible;
};
</script>