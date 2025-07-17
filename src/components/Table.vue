<template>
    <div class="form-container">
        <!-- 表单类型选择器 -->
        <div class="form-tabs">
            <button @click="formType = 'node'" :class="formType === 'node' ? 'active' : ''" class="tab-button">
                节点
            </button>
            <button @click="formType = 'link'" :class="formType === 'link' ? 'active' : ''" class="tab-button">
                链接
            </button>
        </div>

        <!-- 表单内容 -->
        <form @submit.prevent="handleSubmit" class="form-content">
            <!-- 通用字段 -->
            <div class="form-row">
                <div class="form-group">
                    <label for="id" class="form-label">ID</label>
                    <input type="text" id="id" v-model="currentForm.id" class="form-input" placeholder="唯一标识符"
                        required />
                </div>
                <div class="form-group">
                    <label for="content" class="form-label">内容</label>
                    <input type="text" id="content" v-model="currentForm.content" class="form-input"
                        placeholder="节点/链接内容" required />
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="group" class="form-label">分组</label>
                    <input type="text" id="group" v-model="currentForm.group" class="form-input" placeholder="分组名称"
                        required />
                </div>
                <div class="form-group">
                    <label for="labels" class="form-label">标签</label>
                    <div class="label-input-container">
                        <input type="text" v-model="newLabel" class="label-input form-input" placeholder="添加标签" />
                        <button type="button" @click="addLabel" class="add-label-button">
                            添加
                        </button>
                    </div>
                    <div class="labels-container">
                        <span v-for="(label, index) in currentForm.labels" :key="index" class="label-tag">
                            {{ label }}
                            <button type="button" @click="removeLabel(index)" class="remove-label-button">
                                ×
                            </button>
                        </span>
                    </div>
                </div>
            </div>

            <!-- 链接特有的字段 -->
            <div v-if="formType === 'link'" class="form-row">
                <div class="form-group">
                    <label for="source" class="form-label">源节点</label>
                    <input type="text" id="source" v-model="currentForm.source" class="form-input" placeholder="源节点ID"
                        required />
                </div>
                <div class="form-group">
                    <label for="target" class="form-label">目标节点</label>
                    <input type="text" id="target" v-model="currentForm.target" class="form-input" placeholder="目标节点ID"
                        required />
                </div>
            </div>

            <!-- 提交按钮 -->
            <div class="submit-button-container">
                <button type="submit" class="submit-button">
                    <i class="fa fa-plus-circle mr-2"></i> ADD
                </button>
            </div>
        </form>

        <!-- 提交结果展示 -->
        <div v-if="submittedData" class="submitted-data-container">
            <h3 class="submitted-data-title">已提交数据:</h3>
            <pre class="submitted-data-content">{{ submittedData }}</pre>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useDataSotre } from '@/stores/data';
import type { Link, Node } from '@/types/data.types';
import { ref, computed, watch, getCurrentWatcher } from 'vue';

// 表单状态管理
const formType = ref<'node' | 'link'>('node');
const newLabel = ref('');
const submittedData = ref<Node | Link | null>(null);

const store = useDataSotre();

// 使用计算属性动态切换表单数据结构
const currentForm = computed<any>(() => {
    if (formType.value === 'node') {
        return {
            id: '',
            content: '',
            group: '',
            labels: []
        } as Node;
    } else {
        return {
            id: '',
            content: '',
            labels: [],
            group: '',
            source: '',
            target: ''
        } as Link;
    }
});

watch(formType, () => {
    newLabel.value = "";
})

// 添加标签
const addLabel = () => {
    if (newLabel.value.trim()) {
        currentForm.value.labels.push(newLabel.value.trim());
        newLabel.value = '';
    }
};

// 移除标签
const removeLabel = (index: number) => {
    currentForm.value.labels.splice(index, 1);
};

// 处理表单提交
const handleSubmit = () => {
    // 简单验证
    if (!currentForm.value.id) {
        alert('请输入ID');
        return;
    }
    // 对于链接表单的额外验证
    if (formType.value === 'link') {
        if (!currentForm.value.source || !currentForm.value.target) {
            alert('请输入源节点和目标节点');
            return;
        }
    }

    if (formType.value === 'node') {
        store.addNode(currentForm.value);

        currentForm.value.id = '';
        currentForm.value.content = '';
        currentForm.value.labels = [];
        currentForm.value.group = '';

    } else {
        store.addLink(currentForm.value);

        currentForm.value.id = '';
        currentForm.value.content = '';
        currentForm.value.labels = [];
        currentForm.value.group = '';
        currentForm.value.source = '';
        currentForm.value.target = '';

    }
};
</script>

<style scoped>
.form-container {
    margin: 5px;
    width: 100%-10px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border: 1px solid #01060e;
    padding: 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 鼠标悬停效果 */
.form-container:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

/* 表单标签样式 */
.form-tabs {
    display: flex;
    margin-bottom: 24px;
    border-bottom: 1px solid #e2e8f0;
}

.tab-button {
    flex: 1;
    padding: 12px 16px;
    text-align: center;
    font-weight: 500;
    border: none;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;
    color: #64748b;
}

.tab-button.active {
    color: #165DFF;
    border-bottom-color: #165DFF;
    font-weight: 600;
}

.tab-button:hover:not(.active) {
    background-color: #f8fafc;
    color: #475569;
}

/* 表单内容样式 */
.form-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.form-group {
    flex: 1;
    min-width: 280px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #334155;
}

.form-input {
    width: 85%;
    padding: 10px 12px;
    font-size: 14px;
    line-height: 1.5;
    color: #334155;
    background-color: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus {
    color: #334155;
    background-color: #fff;
    border-color: #94a3b8;
    outline: 0;
    box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.2);
}

/* 标签样式 */
.label-input-container {
    display: flex;
}

.label-input {
    border-radius: 6px 0 0 6px;
    flex: 1;
}

.add-label-button {
    margin-right: 5%;
    padding: 10px 10px;
    background-color: #165DFF;
    color: white;
    border: none;
    border-radius: 0 6px 6px 0;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-weight: 500;
}

.add-label-button:hover {
    background-color: #0d47a1;
}

.labels-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.label-tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    background-color: #e6f7ff;
    color: #165DFF;
    border-radius: 16px;
    font-size: 12px;
    border: 1px solid #91caff;
}

.remove-label-button {
    margin-left: 4px;
    background: none;
    border: none;
    color: #165DFF;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    transition: transform 0.2s ease;
}

.remove-label-button:hover {
    color: #0d47a1;
    transform: scale(1.1);
}

/* 提交按钮 */
.submit-button-container {
    margin-top: 16px;
}

.submit-button {
    width: 100%;
    padding: 12px 16px;
    background-color: #165DFF;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 16px;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.submit-button:hover {
    background-color: #0d47a1;
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.submit-button:active {
    transform: translateY(0);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 提交结果展示 */
.submitted-data-container {
    margin-top: 24px;
    padding: 16px;
    background-color: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.submitted-data-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #334155;
}

.submitted-data-content {
    font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
    background-color: #e2e8f0;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    color: #334155;
    max-height: 120px;
}
</style>