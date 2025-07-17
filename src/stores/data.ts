import { ref, computed, reactive, shallowReactive } from 'vue'
import { defineStore } from 'pinia'


export const useDataSotre = defineStore('dataBase', ()=>{

    const nodeMap = reactive(new Map<string,NodeDto>());
    const linkMap = reactive(new Map<string,LinkDto>());
    const nodeGroupMap = shallowReactive(new Map<string,NodeGroup>())
    const linkGroupMap = shallowReactive(new Map<string,LinkGroup>())

    const nodeGroupRoot = reactive({
        id:"node_group_root",
        children: [] as NodeGroup[],
    } as NodeGroup)
    const linkGroupRoot = reactive({
        id:"link_group_root",
        children: [] as LinkGroup[],
    } as LinkGroup)

    const loadData = async ()=>{
        const response = await fetch('/data.json');
        if (!response.ok) return;
        let temp:Data = await response.json() as Data;
        console.log("loading nodes");
        for(let i of temp.nodes){
            nodeMap.set(i.id,{
                id:i.id,
                content:i.content,
                group:i.group,
                labels:i.labels,
                linksOut:[]
            } as NodeDto);
        }
        console.log("loading links");
        for(let i of temp.links){
            let {id,source,target,labels} = i;
            let fromN = nodeMap.get(source)
            let toN = nodeMap.get(target)
            if(!fromN||!toN) continue;
            const linkDto = {
                id:id,
                // 这里后面会改
                content:"",
                group:"",
                labels:labels,
                from:fromN,
                to:toN,
            } as LinkDto;
            linkMap.set(id,linkDto);
            fromN.linksOut.push(linkDto);
        }
    }

    return{
        nodeMap,
        linkMap,
        nodeGroupMap,
        linkGroupMap,
        nodeGroupRoot,
        linkGroupRoot,
        loadData,
    }

});