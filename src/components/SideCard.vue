<template>
    <div style="padding-left: 5px; padding-top: 5px; padding-right: 2px;">
        <a-card hoverable style="width: 100%; height: 70%;" :tab-list="tabList" :active-tab-key="tab" :title="'信息面板'"
            @tabChange="(key: string) => { tab = key }">
            <template v-if="viewInfo.type!=='--'" #actions>
                <a-space-compact>
                    <a-button v-if="tab !== 'edit'" shape="round" type="primary" @click="tab = 'edit'">修改</a-button>
                    <a-button v-if="tab !== 'edit'" shape="round" @click="console.log('删除功能还没做！')">删除</a-button>
                </a-space-compact>
            </template>
            <!-- 不同tab有不同内容 -->
            <a-descriptions v-if="tab === 'info'" :title="`ID: ${viewInfo.type}-${viewInfo.id}`" :column="1"
                size="small">
                <a-descriptions-item v-if="viewInfo.type === 'node'" label="显示名称">{{ viewInfo.name
                    }}</a-descriptions-item>
                <a-descriptions-item label="描述内容">{{ viewInfo.content }}</a-descriptions-item>
                <a-descriptions-item label="组织节点">{{ viewInfo.groupId }}</a-descriptions-item>
                <a-descriptions-item v-if="viewInfo.type === 'link'" label="起点ID">{{ viewInfo.source
                }}</a-descriptions-item>
                <a-descriptions-item v-if="viewInfo.type === 'link'" label="终点ID">{{ viewInfo.target
                }}</a-descriptions-item>
            </a-descriptions>
            <a-descriptions v-if="tab === 'org'" :title="viewInfo.groupId" :column="1" :expandedKeys="viewInfo.groupId">
                <a-descriptions-item label="描述">
                    {{ viewInfo.groupDescription }}
                </a-descriptions-item>
                <a-descriptions-item>
                    <a-tree :selectable="false" :checkable="false" show-line :tree-data="viewGroupTree" :expandedKeys="expandedKeys">
                        <template #title="{ title, key }">
                            {{ title }}
                        </template>
                    </a-tree>
                </a-descriptions-item>
            </a-descriptions>
            <!-- 修改表单 以后会搬迁到主键里面去 -->
            <a-form v-if="tab === 'edit'" :model="viewInfo">
                <a-form-item label="显示名称">
                    <a-input v-model:value="viewInfo.name" />
                </a-form-item>
                <a-form-item label="描述内容">
                    <a-input v-model:value="viewInfo.content" />
                </a-form-item>
                <a-form-item label="组织节点">
                    <a-tree-select v-model:value="viewInfo.groupId" show-search style="width: 100%"
                        :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }" placeholder="Please select" treeLine
                        allow-clear tree-default-expand-all :tree-data="selectGroupTree">
                        <template #title="{ value: val, label }">
                            {{ label }}
                        </template>
                    </a-tree-select>
                </a-form-item>
                <a-space size="large">
                    <a-button type="primary" shape="round" html-type="submit">提交</a-button>
                    <a-button type="default" shape="round" @click="tab = 'info'">取消</a-button>
                </a-space>
            </a-form>
        </a-card>
    </div>
</template>

<script setup lang="tsx">
import { useDataSotre } from '@/stores/data';
import type { Link, Node } from '@/types/data.types';
import { convertGroup } from '@/utils/common.utils';
import { computed, ref } from 'vue';

const tab = ref('info');
const store = useDataSotre();

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

interface Info {
    type: "node" | "link" | "--",
    id: string,
    name: string,
    content: string,
    // group
    groupId: string,
    groupLabel: string,
    groupDescription: string,
    // Link
    source: string,
    target: string,
}

// 未知ID默认为 --
const emptyInfo: Info = {
    type: '--',
    id: '--',
    name: 'Unknown',
    content: '暂无',
    groupId: '--',
    groupDescription: '暂无组织节点描述',
    source: '--',
    target: '--',
    groupLabel: 'Unkonwn'
}

// 显示用的数据，依赖current的指定，如果node或者link有变更也需要重算
const viewInfo = computed(() => {
    const res: Info = JSON.parse(JSON.stringify(emptyInfo));
    if (store.current.id === '--') {
        return res;
    }
    res.type = store.current.type;
    res.id = store.current.id;
    const getData = res.type === 'link' ? store.getLink : store.getNode;
    const v = getData(res.id);
    if (res.type === 'link') {
        res.source = (v as Link).source;
        res.target = (v as Link).target;
    } else {
        res.name = (v as Node).viewName;
    }
    res.content = v.content;
    res.groupId = v.group;
    const group = store.getGroup(res.type as 'link' | 'node', res.groupId)
    res.groupLabel = group.label;
    res.groupDescription = group.description;
    return res;
});


const viewGroupTree = computed(() => {
    if (viewInfo.value.id === "--"
        || viewInfo.value.groupId === "--"
        || viewInfo.value.type === "--"
    ) {
        return [];
    }
    const root = store.getGroup(viewInfo.value.type);
    const res = convertGroup(root,'view')[0].children;
    return res;
})


const selectGroupTree = computed(()=>{
    if (viewInfo.value.id === "--"
        || viewInfo.value.groupId === "--"
        || viewInfo.value.type === "--"
    ) {
        return [];
    }
    const root = store.getGroup(viewInfo.value.type);
    return convertGroup(root,'select')[0].children;
})

const expandedKeys = computed(()=>{
    if (viewInfo.value.id === "--"
        || viewInfo.value.groupId === "--"
        || viewInfo.value.type === "--"
    ) {
        return [];
    }
    return [viewInfo.value.groupId];
})

</script>

<style lang="css" scoped></style>