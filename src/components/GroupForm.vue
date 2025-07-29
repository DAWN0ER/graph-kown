<template>
    <div class="graph-group-form">
        <a-form :model="formData">
            <a-form-item label="所属组织">
                <a-radio-group v-model:value="formData.type" button-style="solid">
                    <a-radio-button value="node">节点（node）</a-radio-button>
                    <a-radio-button value="link">关系（link）</a-radio-button>
                </a-radio-group>
            </a-form-item>
            <!-- 节点特定属性 -->
            <a-form-item label="组织名称">
                <a-input v-model:value="formData.label" />
            </a-form-item>
            <!-- 基础信息 -->
            <a-form-item label="组织描述描述">
                <a-input v-model:value="formData.description" />
            </a-form-item>
            <!-- 这里是为了给出所有父节点选项，应该是个可拖拽树组件 -->
            <a-form-item label="上级组织节点">
                <a-tree-select v-model:value="formData.parentGroup" show-search style="width: 100%"
                    :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }" placeholder="请选择组织节点" tree-line
                    allow-clear tree-default-expand-all :tree-data="selectGroupTree">
                    <template #title="{ label, selectable }">
                        {{ label }}
                    </template>
                </a-tree-select>
            </a-form-item>
            <a-form-item label="是否作为数据节点">
                <a-switch v-model:checked="formData.isLeaf" checked-children="YES" un-checked-children="NO" />
            </a-form-item>

            <a-flex style="width: 100%;" :justify="'center'" gap="middle">
                <button class="btn-primary" @click="handleSubmit">
                    {{ isEditMode ? '保存' : '添加' }}
                </button>
                <button class="btn-ghost" @click="emit('cancel')">
                    取消
                </button>
                <button class="btn-ghost" @click="refreshFormData">
                    重置
                </button>
            </a-flex>
        </a-form>
    </div>
</template>

<script setup lang="ts">
import { useDataSotre } from '@/stores/data';
import type { Group, Link, Node } from '@/types/data.types';
import { convertGroup } from '@/utils/common.utils';
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { generateUnique16BitUid } from '@/utils/tool.utils';

const store = useDataSotre();

interface GroupInfo {
    type: "node" | "link" | "--"; // 主要是为了方便感知
    isLeaf: boolean;
    id: string;
    label: string;
    description: string;
    parentGroup: string; // 存储父Group的id
}
const emptyData: GroupInfo = {
    type: '--',
    isLeaf: false,
    id: "",
    label: "",
    description: "",
    parentGroup: ''
}


const props = defineProps({
    // 当前操作模式
    formMode: {
        type: String,
        required: true,
        validator: (value: string) => ['add', 'edit', 'simpleEdit'].includes(value)
        // 对应三种模式：添加Group，修改Group（包括父节点），简单修改Group（Label 和 Description）
    },
});

const emit = defineEmits<{
    (e: 'cancel'): void,
}>();

// 表单数据
const formData = ref<GroupInfo>({
    type: "--",
    isLeaf: false,
    id: '',
    label: '',
    description: '',
    parentGroup: '', // 存储父Group的id
});

// 计算属性：当前是否为编辑模式
const isEditMode = computed(() => props.formMode !== 'add');

// 计算属性：可选择组织节点
// 如果是修改模式就需要默认展示原来的组织节点，如果是添加就默认全展开
// 这里可能需要一个 Group change 的时候依赖的trigger
// 依赖 current
const selectGroupTree = computed(() => {
    if (isEditMode.value) {
        if (store.current.id === "--" || store.current.type === "--") {
            return [];
        }
        const root = store.getGroup(store.current.type);
        return convertGroup(root, 'selectNotLeaf');
    } else {
        const type = formData.value.type;
        if(type === "--"){
            return [];
        }
        const root = store.getGroup(type);
        const res = convertGroup(root, 'selectNotLeaf');
        return res;
    }

})


// 也就是为当前选择的节点计算数值
const initialData = (type: "--" | "node" | "link", id: string): GroupInfo => {
    const res = JSON.parse(JSON.stringify(emptyData));
    if (id === '--') {
        return res;
    }
    // TODO 这里需要处理group的初始化
    return res;
}

// 观测当前的current
watch(() => store.current, (newVal) => {
    const { type, id } = newVal;
    if (isEditMode.value) {
        formData.value = { ...initialData(type, id) };
    }
}, { deep: true })

// 刷新表单数据
const refreshFormData = () => {
    // 添加模式，生成空数据
    formData.value = JSON.parse(JSON.stringify(emptyData));

    // 编辑模式，使用初始数据填充表单
    if (isEditMode.value) {
        const { type, id } = store.current
        formData.value = { ...initialData(type, id) };
    }
};

// 处理表单提交
const handleSubmit = () => {
    // 根据当前模式过滤数据
    let dataToSave: GroupInfo = { ...formData.value };
    const res: Group = {
        id: generateUnique16BitUid(),
        label: dataToSave.label,
        description: dataToSave.description,
        isLeaf: dataToSave.isLeaf,
        children: [],
    }
    if(dataToSave.type === 'node'){
        store.addGroup(res,"node",dataToSave.parentGroup);
    }
    refreshFormData();
    emit('cancel');
};

// 组件挂载时初始化表单
onMounted(() => {
    refreshFormData();
});
</script>

<style scoped>
.graph-group-form {
    padding: 10px;
    border-radius: 10px;
    margin-top: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background-color: white;
}

/* 绿色系主按钮样式（匹配 colorPrimary: "#00ba7d"） */
.btn-primary {
    background-color: #00ba7d;
    /* 主题主色 */
    color: #fff;
    /* 白色文字 */
    border: none;
    border-radius: 32px;
    padding: 6px 16px;
    font-size: 15px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    /* 平滑过渡 */
}

/* 主按钮交互状态 */
.btn-primary:hover {
    background-color: #00a86b;
    /* hover时加深一点 */
}

.btn-primary:active {
    background-color: #00965e;
    /* 点击时更深 */
}

.btn-primary:focus {
    outline: 2px solid rgba(0, 186, 125, 0.3);
    /* 聚焦时显示绿色轮廓 */
    outline-offset: 2px;
}

/* 幽灵按钮样式（绿色边框） */
.btn-ghost {
    background-color: transparent;
    color: #00ba7d;
    /* 主色文字 */
    border: 1px solid #00ba7d;
    /* 主色边框 */
    border-radius: 32px;
    padding: 6px 16px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

/* 幽灵按钮交互状态 */
.btn-ghost:hover {
    background-color: rgba(0, 186, 125, 0.08);
    /* 轻微绿色背景 */
}

.btn-ghost:active {
    background-color: rgba(0, 186, 125, 0.15);
    /* 点击时加深背景 */
}

.btn-ghost:focus {
    outline: 2px solid rgba(0, 186, 125, 0.3);
    outline-offset: 2px;
}
</style>