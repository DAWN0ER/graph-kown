<template>
    <div class="graph-element-form">
        <a-form :model="formData" @submit="handleSubmit">
            <!-- 基础信息 -->
            <a-form-item v-if="formData.type === 'node'" label="显示名称">
                <a-input v-model:value="formData.name" />
            </a-form-item>

            <a-form-item label="描述内容">
                <a-input v-model:value="formData.content" />
            </a-form-item>

            <a-form-item label="组织节点">
                <a-tree-select v-model:value="formData.groupId" show-search style="width: 100%"
                    :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }" placeholder="请选择组织节点" tree-line
                    allow-clear tree-default-expand-all :tree-data="selectGroupTree">
                    <template #title="{ value: val, label }">
                        {{ label }}
                    </template>
                </a-tree-select>
            </a-form-item>

            <!-- 链接特定属性 -->
            <div v-if="formData.type === 'link'" class="link-properties">
                <a-form-item label="起点">
                    <a-select v-model:value="formData.source" style="width: 100%">
                        <a-select-option v-for="node in availableSourceNodes" :key="node.id" :value="node.id">
                            {{ node.viewName }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item label="终点">
                    <a-select v-model:value="formData.target" style="width: 100%">
                        <a-select-option v-for="node in availableTargetNodes" :key="node.id" :value="node.id">
                            {{ node.viewName }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
            </div>

            <a-space size="large">
                <a-button type="primary" shape="round" @click="handleSubmit">
                    {{ isEditMode ? '保存修改' : '添加' }}
                </a-button>
            </a-space>
        </a-form>
    </div>
</template>

<script setup lang="ts">
import { useDataSotre } from '@/stores/data';
import type { Link, Node } from '@/types/data.types';
import { convertGroup } from '@/utils/common.utils';
import { ref, computed, onMounted, watch } from 'vue';

const store = useDataSotre();

interface Info {
    type: "node" | "link" | "--";
    id: string;
    name: string;
    content: string;
    groupId: string;
    groupDescription: string;
    // Link
    source: string;
    target: string;
}

const props = defineProps({
    // 当前操作模式
    formMode: {
        type: String,
        required: true,
        validator: (value: string) => ['addNode', 'addLink', 'edit'].includes(value)
    },
});

// 表单数据
const formData = ref<Partial<Info>>({
    type: '--',
    id: '',
    name: '',
    content: '',
    groupId: '',
    groupDescription: '',
    source: '',
    target: '',
});

const triggerAvalibleNodes = ref(0);

// 计算属性：当前是否为编辑模式
const isEditMode = computed(() => props.formMode === 'edit');

// 对于 Links 计算属性：可用节点列表，从 store 里面拿到，依赖current
// 这里有一致性的问题，干脆每次 open 一次就计算一次
const availableSourceNodes = computed<{ id: string, viewName: string }[]>(() => {
    if (formData.value.type === "link" && formData.value.groupId) {
        const linkGroupInfo = store.getGroup('link', formData.value.groupId);
        if (!linkGroupInfo.sourceGroup) return [];
        const sourceGroupInfo = store.getGroup('node', linkGroupInfo.sourceGroup, true);
        const res = (sourceGroupInfo.children as string[]).map(id => {
            return { id: id, viewName: store.getNode(id).viewName };
        })
        return res;
    }
    return [];
});
const availableTargetNodes = computed<{ id: string, viewName: string }[]>(() => {
    if (formData.value.type === "link" && formData.value.groupId) {
        const linkGroupInfo = store.getGroup('link', formData.value.groupId);
        if (!linkGroupInfo.targetGroup) return [];
        const targetGroupInfo = store.getGroup('node', linkGroupInfo.targetGroup, true);
        return (targetGroupInfo.children as string[]).map(id => {
            return { id: id, viewName: store.getNode(id).viewName };
        })
    }
    return [];
});
// 计算属性：可选择组织节点
// 如果是修改模式就需要默认展示原来的组织节点，如果是添加就默认全展开
// 这里可能需要一个 Group change 的时候依赖的trigger
// 依赖 current
const selectGroupTree = computed(() => {
    if (isEditMode.value) {
        if (store.current.id === "--"|| store.current.type === "--") {
            return [];
        }
        const root = store.getGroup(store.current.type);
        return convertGroup(root, 'select')[0].children;
    } else {
        const type = props.formMode.includes("Node") ? "node" : "link";
        const root = store.getGroup(type);
        return convertGroup(root, 'select')[0].children;
    }

})

const emptyInfo: Info = {
    type: '--',
    id: '',
    name: '',
    content: '',
    groupId: '',
    groupDescription: '',
    source: '',
    target: ''
}

// 也就是为当前选择的节点计算数值
const initialData = (type: "--" | "node" | "link", id: string): Info => {
    const res = JSON.parse(JSON.stringify(emptyInfo));
    if (id === '--') {
        return res;
    }
    res.type = type;
    res.id = id;
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
}

watch(() => store.current, (newVal) => {
    const { type, id } = newVal;
    if (isEditMode.value) {
        formData.value = { ...initialData(type, id) };
    }
}, { deep: true })

// 初始化表单数据
const initFormData = () => {
    // 添加模式，生成空数据
    formData.value = JSON.parse(JSON.stringify(emptyInfo));
    formData.value.type = props.formMode.includes("node") ? 'node' : 'link';

    // 编辑模式，使用初始数据填充表单
    if (isEditMode.value) {
        console.log('initForm')
        const { type, id } = store.current
        formData.value = { ...initialData(type, id) };
    }
};

// 处理表单提交
const handleSubmit = () => {
    // 根据当前模式过滤数据
    let dataToSave: Partial<Info> = { ...formData.value };
    console.log("submit")
    // 确保类型与当前模式一致
    dataToSave.type = props.formMode.includes('Node') ? 'node' : 'link';

    // 移除不需要的字段
    if (dataToSave.type === 'node') {
        delete dataToSave.source;
        delete dataToSave.target;
    } else {
        delete dataToSave.name;
    }
    // 处理修改
    if (isEditMode.value) {
        if (dataToSave.type === "node") {
            // 还没想好怎么处理
        } else {

        }
    }
    // 处理添加 
    else {
        if (dataToSave.type === "node") {
            store.addNode({
                id: dataToSave.id || 'id',
                viewName: dataToSave.name || '',
                content: dataToSave.content || '',
                group: dataToSave.groupId || 'default',
                labels: []
            })
        } else {
            store.addLink({
                id: dataToSave.id || '--',
                content: dataToSave.content || '',
                labels: [],
                group: dataToSave.groupId || 'default',
                source: dataToSave.source || '',
                target: dataToSave.target || '',
            })
        }
    }

};

const dataChange = (ns: string[], ls: string[]) => {
    if (ns.length > 0) {
        triggerAvalibleNodes.value = (triggerAvalibleNodes.value + 1) % 13;
    }
}

// 组件挂载时初始化表单
onMounted(() => {
    initFormData();
    store.registerHook(dataChange, "add");
    store.registerHook(dataChange, 'del');
    console.log("mounted");

});
</script>

<style scoped>
.graph-element-form {
    padding: 16px;
    margin-top: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background-color: white;
}

.link-properties {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #b8b8b8;
}
</style>