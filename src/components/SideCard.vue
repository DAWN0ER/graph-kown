<template>
    <div style="padding-left: 5px; padding-top: 5px; padding-right: 2px;">
        <a-card hoverable style="width: 100%; height: 70%;" :tab-list="tabList" :active-tab-key="tab" :title="'信息面板'"
            @tabChange="(key: string) => { tab = key }">
            <template #actions>
                <a-bottun>修改</a-bottun>
            </template>
            <!-- 不同tab有不同内容 -->
                <a-descriptions v-if="tab === 'info'" title="Card title" :column="1" size="small">
                    <a-descriptions-item label="Product">没有内容</a-descriptions-item>
                    <a-descriptions-item label="Billing Mode">Prepaid</a-descriptions-item>
                    <a-descriptions-item label="Automatic Renewal">YES</a-descriptions-item>
                </a-descriptions>
 
        </a-card>
    </div>
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue';

const tab = ref('info');

const tabList = [
    {
        key: 'info',
        tab: '基本信息',
    },
    {
        key: 'org',
        tab: '组织结构',
    },
];

const AllInfo = reactive({});

</script>

<style lang="css" scoped>

</style>