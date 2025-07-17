import { ref, computed, reactive, shallowReactive } from 'vue'
import { defineStore } from 'pinia'
import type { LinkVo, NodeVo } from '@/types/render.types';
import type { Link,Node,Data } from '@/types/data.types';

type DataHookFunc = (nodes: string[], links: string[]) => void

export const useDataSotre = defineStore('dataBase', () => {

    const nodeMap = reactive(new Map<string, NodeDto>());
    const linkMap = reactive(new Map<string, LinkDto>());
    const nodeGroupMap = shallowReactive(new Map<string, NodeGroup>())
    const linkGroupMap = shallowReactive(new Map<string, LinkGroup>())

    const nodeGroupRoot = reactive({ id: "node_group_root", children: [] as NodeGroup[] } as NodeGroup)
    const linkGroupRoot = reactive({ id: "link_group_root", children: [] as LinkGroup[] } as LinkGroup)

    const dealWithAdd: DataHookFunc[] = [];
    const dealWithDel: DataHookFunc[] = [];

    // 类型转换工具
    const convertNode = (jsonData: Node): NodeDto => {
        return {
            id: jsonData.id,
            content: jsonData.content,
            group: jsonData.group,
            labels: jsonData.labels,
            linksIn: [],
            linksOut: [],
        }
    }

    const convertLink = (jsonData: Link): LinkDto => {

        return {
            id: jsonData.id,
            content: jsonData.content,
            group: jsonData.group,
            labels: jsonData.labels,
            from: nodeMap.get(jsonData.source) as NodeDto,
            to: nodeMap.get(jsonData.target) as NodeDto,
        }
    }

    const convertNodeV = (node: NodeDto): NodeVo => {
        return {
            id: node.id,
            content: node.content,
            context: undefined,
            style: undefined,
        }
    }

    const convertLinkV = (link: LinkDto): LinkVo => {
        return {
            id: link.id,
            source: link.from.id,
            target: link.to.id,
            context: undefined,
            style: undefined,
        }
    }

    const changeNode = (node: NodeDto, operate: "add" | "del") => {
        switch (operate) {
            case 'add':
                nodeMap.set(node.id, node);
                break;
            case 'del':
                nodeMap.delete(node.id);
                const tmpI = node.linksIn;
                node.linksIn = [];
                tmpI.forEach(l => changeLink(l, "del"));
                const tmpO = node.linksOut;
                node.linksOut = [];
                tmpO.forEach(l => changeLink(l, "del"));
                break;
        }
    }

    const changeLink = (link: LinkDto, operate: "add" | "del") => {
        switch (operate) {
            case 'add':
                linkMap.set(link.id, link);
                link.from.linksOut.push(link);
                link.to.linksIn.push(link);
                break;
            case 'del':
                linkMap.delete(link.id);
                link.to.linksIn.splice(link.to.linksIn.findIndex(e=>e.id===link.id),1);
                link.from.linksOut.splice(link.from.linksOut.findIndex(e=>e.id===link.id),1);
                break;
        }
    }

    /// -------------- EXPORT ---------------------

    const loadData = async () => {
        const response = await fetch('/data.json');
        if (!response.ok) return;
        let temp: Data = await response.json() as Data;
        console.log("loading nodes");
        for (let ele of temp.nodes) {
            const tmpNode = convertNode(ele);
            nodeMap.set(tmpNode.id, tmpNode);
        }
        console.log("loading links");
        for (let ele of temp.links) {
            const tmpLink = convertLink(ele);
            linkMap.set(tmpLink.id, tmpLink);
            tmpLink.from.linksOut.push(tmpLink);
            tmpLink.to.linksIn.push(tmpLink);
        }
    }

    const initGraphData = () => {
        return {
            ns: Array.from(nodeMap.values()).map(convertNodeV),
            ls: Array.from(linkMap.values()).map(convertLinkV),
        }
    }

    const registerHook = (fn:DataHookFunc,hookAt:"add"|"del")=>{
        switch(hookAt){
            case 'add':
                dealWithAdd.push(fn);
                break;
            case 'del':
                dealWithDel.push(fn);
                break;
        }
    }

    const addNode = (node: Node) => {
        changeNode(convertNode(node),"add")
        dealWithAdd.forEach((fn) => fn([node.id], []));
    }

    const addLink = (link: Link) => {
        changeLink(convertLink(link),"add");
        dealWithAdd.forEach(fn => fn([], [link.id]));
    }

    const delNode = (id: string) => {
        const val = nodeMap.get(id);
        if (!val) return;
        const ins = val.linksIn.map(l => l.id);
        const outs = val.linksOut.map(l => id);
        changeNode(val,"del");
        dealWithDel.forEach(fn=>fn([id],[...ins,...outs]))
    }

    const delLink = (id: string) => {
        const val = linkMap.get(id);
        if (!val) return;
        changeLink(val,"del");
        dealWithDel.forEach(fn=>fn([],[id]));
    }

    const getNodeV = (id: string) => {
        return convertNodeV(nodeMap.get(id) as NodeDto);
    }

    const getLinkV = (id:string) => {
        return convertLinkV(linkMap.get(id) as LinkDto)
    } 

    return {
        loadData,
        initGraphData,
        addLink,
        addNode,
        delLink,
        delNode,
        registerHook,
        getNodeV,
        getLinkV,
    }

});