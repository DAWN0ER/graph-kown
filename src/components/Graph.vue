<template>
    <div ref="graphContainer" class="force-graph-container" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import ForceGraph from 'force-graph';
import type { NodeVo, LinkVo } from '../types/render.types';
import { useDataSotre } from '../stores/data';
import { drawTextBox } from '../utils/render.utils';
import * as d3 from 'd3';

const graphContainer = ref<HTMLDivElement | null>(null);
const store = useDataSotre();

const nodes = new Map<string, NodeVo>();
const links = new Map<string, LinkVo>();

const draw = shallowRef<ForceGraph | null>(null);

const textBoxConfig = (node: any, ctx: any, globalScale: any) => {
    const text = node.viewName;
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
    })
};

onMounted(() => {
    if (!graphContainer.value) return;
    draw.value = new ForceGraph(graphContainer.value)
        .backgroundColor("#ffffff")
        .width(graphContainer.value.clientWidth)
        .height(graphContainer.value.clientHeight)
        .nodeVal(25)
        .linkWidth(4).linkColor("#8B5CF6")
        .nodeCanvasObject(textBoxConfig)
        .linkDirectionalParticles(4)
        .linkDirectionalParticleWidth(5)
        .linkDirectionalParticleSpeed(0.008);
    // force
    draw.value.d3VelocityDecay(0.6);
    draw.value.d3Force('collide', d3.forceCollide().radius(50).strength(0.4));
    draw.value.d3Force('link', d3.forceLink().strength(0.1));
    draw.value.d3Force("charge", d3.forceManyBody().strength(20).theta(0.8).distanceMin(100));

    draw.value.onNodeClick((node,event)=>{
        store.current={
            type:'node',
            id:(node as NodeVo).id
        }
        // console.log(store.current)
    })
    draw.value.onLinkClick((link,event)=>{
        store.current={
            type:'link',
            id:(link as LinkVo).id
        }
        // console.log(store.current)
    })

    store.registerHook(dealAdd, "add");
    store.registerHook(dealDel, "del");
    store.registerUpdateHook(edit);
});

onUnmounted(()=>{
    store.unregisterHook(dealAdd, "add");
    store.unregisterHook(dealDel, "del");
    store.unregisterUpdateHook(edit);
    draw.value = null;
});

watch(()=>store.change ,(val:number)=>{
    console.log("load finish")
        const { ns, ls } = store.initGraphData();
        for (let n of ns) nodes.set(n.id, n);
        for (let l of ls) links.set(l.id, l);
        refresh();
});

const refresh = () => {
    draw.value?.graphData({
        nodes: Array.from(nodes.values()),
        links: Array.from(links.values()),
    });
}

const dealAdd = (ns: string[], ls: string[]) => {
    ns.forEach(id => {
        const tmp = store.getNodeV(id);
        nodes.set(id, tmp);
    })
    ls.forEach(id => {
        const tmp = store.getLinkV(id);
        links.set(id, tmp);
    })
    refresh();
}

const dealDel = (ns: string[], ls: string[]) => {
    ns.forEach(id => nodes.delete(id));
    ls.forEach(id => links.delete(id));
    refresh();
}

const edit = (id: string, type: "node" | "link", data: any) => {
    if (type === "node") {
        (nodes.get(id) as NodeVo).viewName = data.viewName;
    }
}

</script>

<style scoped>
.force-graph-container {
    width: 100%;
    height: 100%;
   flex: auto;
}
</style>