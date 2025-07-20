<template>
    <a-flex :class="['topUI']" :justify="'center'" gap="middle">
        <a-space-compact>
            <a-button shape="round" type="primary">添加节点</a-button>
            <a-button shape="round" type="primary">添加链接</a-button>
        </a-space-compact>
        <a-space-compact>
            <a-button shape="round" type="primary">编辑节点组</a-button>
            <a-button shape="round" type="primary">编辑链接组</a-button>
        </a-space-compact>
        <a-button shape="round" type="default" @click="fileInput?.click()" :disabled="btnText!=='上传文件'">{{ btnText }}</a-button>
        <input ref="fileInput" @change="click" style="display:none;" type="file" id="jsonFileInput" accept=".json">
        
        <a-button type="primary" @click="save">保存</a-button>
        <!-- 测试下拉菜单 -->
        <a-dropdown :open="dropdownVisible" @openChange="handleVisibleChange" :trigger="['click']" placement="bottom">
            <a-button type="primary" slot="trigger" @click.prevent>
                打开下拉表单
            </a-button>
            <!-- 下拉内容：表单 -->
            <template #overlay>
                <ElementForm :formMode="'addLink'"/>
            </template>
        </a-dropdown>
    </a-flex>
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue';
import type { Data } from '@/types/data.types';
import { useDataSotre } from '@/stores/data';
import ElementForm from '@/components/ElementForm.vue'

const store = useDataSotre();

const fileInput = ref<HTMLInputElement | null>(null);
const btnText = ref<string>('上传文件')

const click = () => {
    const files = fileInput.value?.files;
    if (!files) return;
    files[0].text().then((content) => {
        const data = JSON.parse(content) as Data;
        store.loadData(data);
        console.log("SUCCESS")
        btnText.value = `当前文件：${files[0].name}`;
    })
}

const save = () => {
    store.downloadData();
}

const dropdownVisible = ref(false);
const formData = reactive({ name: '', age: null })

function handleVisibleChange(visible: boolean) {
    dropdownVisible.value = visible;
};
// 表单提交逻辑
function handleSubmit(values: any) {
    console.log('表单提交数据：', values);
    dropdownVisible.value = false; // 提交后关闭下拉
}

</script>

<style lang="css" scoped>
.topUI {
    height: 100%;
    padding-top: 10px;
    pointer-events: auto;
}
</style>