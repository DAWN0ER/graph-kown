<template>
    <div style="padding-left: 5px; padding-top: 5px; padding-right: 2px;">
        <a-card hoverable style="width: 100%; height: 70%;" :tab-list="tabList" :active-tab-key="tab" :title="'信息面板'"
            @tabChange="(key: string) => { tab = key }">
            <template #actions>
                <a-bottun v-if="tab !== 'edit'" @click="tab = 'edit'">修改</a-bottun>
                <a-bottun v-if="tab !== 'edit'" @click="console.log('删除功能还没做！')">删除</a-bottun>
            </template>
            <!-- 不同tab有不同内容 -->
            <a-descriptions v-if="tab === 'info'" :title="`ID: ${alllInfo.type}-${alllInfo.id}`" :column="1"
                size="small">
                <a-descriptions-item v-if="alllInfo.type === 'node'" label="显示名称">{{ alllInfo.id
                }}</a-descriptions-item>
                <a-descriptions-item label="描述内容">{{ alllInfo.content }}</a-descriptions-item>
                <a-descriptions-item label="组织节点">{{ alllInfo.groupId }}</a-descriptions-item>
                <a-descriptions-item v-if="alllInfo.type === 'node'" label="出度">{{ alllInfo.linksOut
                    }}</a-descriptions-item>
                <a-descriptions-item v-if="alllInfo.type === 'node'" label="入度">{{ alllInfo.LinksIn
                    }}</a-descriptions-item>
                <a-descriptions-item v-if="alllInfo.type === 'link'" label="起点ID">{{ alllInfo.source
                    }}</a-descriptions-item>
                <a-descriptions-item v-if="alllInfo.type === 'link'" label="终点ID">{{ alllInfo.target
                    }}</a-descriptions-item>
            </a-descriptions>
            <a-descriptions v-if="tab === 'org'" :title="alllInfo.groupId" :column="1" :expandedKeys="alllInfo.groupId">
                <a-descriptions-item label="描述">
                    {{ alllInfo.groupDescription }}
                </a-descriptions-item>
                <a-descriptions-item>
                    <a-tree :selectable="false" :checkable="false" show-line :tree-data="groupTree">
                        <template #title="{ title, key }">
                            {{ title }}
                        </template>
                    </a-tree>
                </a-descriptions-item>
            </a-descriptions>
            <!-- 修改表单 -->
            <a-form v-if="tab === 'edit'" :model="alllInfo">
                <a-form-item label="显示名称">
                    <a-input v-model:value="alllInfo.name" />
                </a-form-item>
                <a-form-item label="描述内容">
                    <a-input v-model:value="alllInfo.content" />
                </a-form-item>
                <a-form-item label="组织节点">
                    <a-tree-select v-model:value="alllInfo.groupId" show-search style="width: 100%"
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
import { json } from 'd3';
import { computed, reactive, ref, watch } from 'vue';

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
    groupId: string,
    groupDescription: string,
    // Node
    linksOut: number,
    LinksIn: number,
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
    linksOut: 0,
    source: '--',
    target: '--',
    LinksIn: 0
}

// 显示用的数据
const alllInfo = computed(()=>{
    const res:Info = JSON.parse(JSON.stringify(emptyInfo));
    if(store.current.id==='--'){
        return res;
    }
    res.type = store.current.type;
    res.id = store.current.id;
    if(res.type === 'link'){
        const v = store.getLinkV(res.id);
        res.source = v.source;
        res.target = v.target;
    } else {
        const v = store.getNodeV(res.id);
        res.groupId
    }
    return res;
});

/**
 * {
 *  title 显示名称
 *  key GourpId
 *  children 子节点
 *  selectable 是否可选择
 *  isLeaf loadData 的时候用暂时没用
 * } 
 */
const groupTree = [
    {
        title: '根节点',
        key: '0-0',
        children: [
            {
                title: 'parent 1-0',
                key: '0-0-0',
                children: [
                    { title: 'leaf', key: '0-0-0-0' },
                    { title: 'leaf', key: '0-0-0-1' },
                ],
            },
            {
                title: 'parent 1-1',
                key: '0-0-1',
                children: [
                    { key: '0-0-1-0', title: 'sss' }
                ],
            },
            {
                title: '暂无信息',
                key: '--',
            }
        ],
    }, 
];

/**
 * value GroupId
 * label 显示名称
 * selectable: 是否可选
 * children 子节点
 */
const selectGroupTree = [
    {
        value: 'id-1',
        label: '节点-1',
        selectable: false,
        children: [
            {
                value: 'id-1-1',
                label: '节点1-1',
            },
            {
                value: 'id-1-2',
                label: '1-2',
            },
            {
                value: '--',
                label: '无',

            }
        ]

    },
];

const expandedKeys = ref<string[]>(['0-0-0', '0-0-1']);
const selectedKeys = ref<string[]>(['0-0-0', '0-0-1']);
const checkedKeys = ref<string[]>(['0-0-0', '0-0-1']);
watch(expandedKeys, () => {
    console.log('expandedKeys', expandedKeys);
});
watch(selectedKeys, () => {
    console.log('selectedKeys', selectedKeys);
});
watch(checkedKeys, () => {
    console.log('checkedKeys', checkedKeys);
});

</script>

<style lang="css" scoped></style>