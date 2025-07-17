<template>

    <div>
        <div>
            <button>ADD</button>
            <button @click="remove">DELETE</button>
        </div>
        <div ref="graphContainer" class="force-graph-container" />
    </div>


</template>

<script setup lang="ts">
import { h, onMounted, ref, shallowRef, watch } from 'vue';
import ForceGraph from 'force-graph';
import type { NodeVo, LinkVo } from '../types/render.types';
import { useDataSotre } from '../stores/data';
import { findDiff } from '../utils/collect.utils';
import { drawTextBox } from '../utils/render.utils';
import * as d3 from 'd3';

const graphContainer = ref<HTMLDivElement | null>(null);
const store = useDataSotre();

const nodes = new Map<string, NodeVo>();
const links = new Map<string, LinkVo>();

const draw = shallowRef<ForceGraph | null>(null);

onMounted(() => {
    if (!graphContainer.value) return;
    draw.value = new ForceGraph(graphContainer.value)
        .backgroundColor("#ffffff")
        .width(900).height(700).nodeVal(25)
        .linkWidth(10).linkColor("#8B5CF6")
        .nodeCanvasObject((node: any, ctx, globalScale) => {
            const text = node.content;
            drawTextBox(ctx, {
                padding: 5 / globalScale,
                text: text,
                fontSize: 28 / globalScale,
                fontFamily: "Roboto Mono",
                x: node.x,
                y: node.y,
                width: 0,
                height: 0,
                fillColor: "#F59E0BCC"
            });
        }).d3VelocityDecay(0.6)
    draw.value.d3Force('collide', d3.forceCollide().radius(50).strength(0.4));
    draw.value.d3Force('link', d3.forceLink().strength(0.1));
    draw.value.d3Force("charge", d3.forceManyBody().strength(20).theta(0.8).distanceMin(100))

    store.loadData().then(() => {
        console.log("theFinish")
        store.nodeMap.forEach((el) => {
            const { id, content } = el;
            nodes.set(id, {
                id: id,
                content: content,
                context: null,
                style: null,
            })
        });
        store.linkMap.forEach((el) => {
            const { id, from, to } = el;
            links.set(id, {
                id: id,
                source: from.id,
                target: to.id,
                style: null,
                context: null,
            })
        });
        refresh();
    });
});

watch(store.nodeMap, (val1) => {
    if (val1.size > nodes.size) {
        console.log("add");
        const addkey = findDiff<string>(Array.from(val1.keys()), new Set(nodes.keys()))[0];
        const addOne = store.nodeMap.get(addkey);
        if (!addOne) return;
        nodes.set(addkey, {
            id: addOne.id,
            content: addOne.content,
            context: null,
            style: null,
        });
    }
    else if (val1.size < nodes.size) {
        console.log("delete");
        const delkey = findDiff(Array.from(nodes.keys()), new Set(val1.keys()))[0];
        nodes.delete(delkey);
        store.linkMap.forEach((el) => {
            const { id, from, to } = el;
            if (!nodes.has(from.id) || !nodes.has(to.id)) {
                links.delete(id);
            }
        });
    }
    else {
        console.log(`default:size=${val1.size},${nodes.size}`);
        return;
    }
    refresh();
})

const refresh = () => {
    draw.value?.graphData({
        nodes: Array.from(nodes.values()),
        links: Array.from(links.values()),
    });
}

const remove = () => {
    const key = store.nodeMap.keys().next().value;
    if (key) store.nodeMap.delete(key);
}

</script>

<style scoped>
button {
    width: 140px;
}

#app {
    flex-direction: row;
}

.force-graph-container {
    width: 800px;
}
</style>