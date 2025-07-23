<template>
    <a-flex :class="['topUI']" :justify="'center'" gap="middle">
        <a-space-compact>
            <DropDownForm :label="'添加节点'" ref="nodeForm">
                <ElementForm :formMode="'addNode'" @cancel="nodeForm?.handleVisibleChange(false)"></ElementForm>
            </DropDownForm>
            <DropDownForm :label="'添加链接'" ref="linkForm">
                <ElementForm :formMode="'addLink'" @cancel="linkForm?.handleVisibleChange(false)"></ElementForm>
            </DropDownForm>
        </a-space-compact>
        <a-space-compact>
            <a-button shape="round" type="primary">添加节点组</a-button>
            <a-button shape="round" type="primary">添加链接组</a-button>
        </a-space-compact>
        <a-button shape="round" type="default" @click="fileInput?.click()" :disabled="btnText !== '上传文件'">{{ btnText
        }}</a-button>
        <input ref="fileInput" @change="click" style="display:none;" type="file" id="jsonFileInput" accept=".json">

        <a-button type="primary" @click="save">保存</a-button>
    </a-flex>
</template>

<script setup lang="tsx">
import { ref } from 'vue';
import type { Data } from '@/types/data.types';
import { useDataSotre } from '@/stores/data';
import DropDownForm from './DropDownForm.vue';
import ElementForm from './ElementForm.vue';

const store = useDataSotre();

const nodeForm = ref<InstanceType<typeof DropDownForm> | null>(null);
const linkForm = ref<InstanceType<typeof DropDownForm> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const btnText = ref<string>('上传文件')

const click = () => {
    const files = fileInput.value?.files;
    if (!files) return;
    files[0].text().then((content) => {
        const data = JSON.parse(content) as Data;
        store.loadData(data);
        console.log(`success to loading data from ${files[0].name}`)
        btnText.value = `当前文件：${files[0].name}`;
    })
}

const save = () => {
    store.downloadData();
}

</script>

<style lang="css" scoped>
.topUI {
    height: 100%;
    padding-top: 10px;
    pointer-events: auto;
}
</style>