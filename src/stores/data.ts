import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { LinkVo, NodeVo } from '@/types/render.types';
import type { Link, Node, Data, Group } from '@/types/data.types';
import { convertDto2Link, convertDto2Node, convertLink2Dto, convertLinkDto2V, convertNode2Dto, convertNodeDto2V, dfsConstructGroupFromDto, handleDownload } from '@/utils/common.utils';
import type { LinkDto, LinkGroup, NodeDto, NodeGroup } from '@/types/cache.types';

type DataHookFunc = (nodes: string[], links: string[]) => void

export const useDataSotre = defineStore('dataBase', () => {

    const nodeMap = new Map<string, NodeDto>();
    const linkMap = new Map<string, LinkDto>();
    const nodeGroupMap = new Map<string, NodeGroup>();
    const linkGroupMap = new Map<string, LinkGroup>();

    const nodeGroupRoot = reactive({ id: "node_group_root", children: [] as NodeGroup[] } as NodeGroup)
    const linkGroupRoot = reactive({ id: "link_group_root", children: [] as LinkGroup[] } as LinkGroup)

    // 初始化默认组
    {
        const defaultNodeGroup: NodeGroup = { id: 'default', label: "default", description: '默认节点组', parentGroup: nodeGroupRoot, children: [] }
        const defaultLinkGroup: LinkGroup = { id: 'default', label: "default", description: '默认链接组', parentGroup: linkGroupRoot, children: [] }
        defaultLinkGroup.sourceGroup = defaultNodeGroup;
        defaultLinkGroup.targetGroup = defaultNodeGroup;
        defaultNodeGroup.linkInGroups = [defaultLinkGroup];
        defaultNodeGroup.linkOutGroups = [defaultLinkGroup];
        nodeGroupMap.set(defaultNodeGroup.id, defaultNodeGroup);
        linkGroupMap.set(defaultLinkGroup.id, defaultLinkGroup);
        (nodeGroupRoot.children as NodeGroup[]).push(defaultNodeGroup);
        (linkGroupRoot.children as LinkGroup[]).push(defaultLinkGroup);
    }

    const dealWithAdd: Set<DataHookFunc> = new Set();
    const dealWithDel: Set<DataHookFunc> = new Set();

    // 这里是观测状态变更用的计数器，只允许在 loadData 的时候用
    const change = ref<number>(0);

    interface CurrentInfo {
        type: "--" | "node" | "link";
        id: string;
    }
    const current = reactive<CurrentInfo>({
        type: "--",
        id: "--"
    })

    // 数据变更工具
    const changeNode = (node: NodeDto, operate: "add" | "del") => {
        switch (operate) {
            case 'add':
                nodeMap.set(node.id, node);
                (nodeGroupMap.get(node.group)?.children as NodeDto[]).push(node);
                break;
            case 'del':
                nodeMap.delete(node.id);
                const tmpI = node.linksIn;
                node.linksIn = [];
                tmpI.forEach(l => changeLink(l, "del"));
                const tmpO = node.linksOut;
                node.linksOut = [];
                tmpO.forEach(l => changeLink(l, "del"));
                const idx = (nodeGroupMap.get(node.group)?.children as NodeDto[]).findIndex(n => n.id === node.id);
                nodeGroupMap.get(node.group)?.children.splice(idx, 1);
                break;
        }
    }

    const changeLink = (link: LinkDto, operate: "add" | "del") => {
        switch (operate) {
            case 'add':
                linkMap.set(link.id, link);
                link.from.linksOut.push(link);
                link.to.linksIn.push(link);
                (linkGroupMap.get(link.group)?.children as LinkDto[]).push(link);
                break;
            case 'del':
                linkMap.delete(link.id);
                link.to.linksIn.splice(link.to.linksIn.findIndex(e => e.id === link.id), 1);
                link.from.linksOut.splice(link.from.linksOut.findIndex(e => e.id === link.id), 1);
                const idx = (linkGroupMap.get(link.group)?.children as LinkDto[]).findIndex(l => l.id === link.id);
                linkGroupMap.get(link.group)?.children.splice(idx, 1);
                break;
        }
    }

    /// -------------- EXPORT ---------------------

    const loadData = async (temp: Data) => {
        console.log("loading nodes");
        for (let ele of temp.nodes) {
            const tmpNode = convertNode2Dto(ele);
            nodeMap.set(tmpNode.id, tmpNode);
            if (!tmpNode.group || tmpNode.group === "" || tmpNode.group === "default") {
                (nodeGroupMap.get("default")?.children as NodeDto[]).push(tmpNode)
            }
        }
        console.log("loading links");
        for (let ele of temp.links) {
            const tmpLink = convertLink2Dto(ele, nodeMap);
            linkMap.set(tmpLink.id, tmpLink);
            tmpLink.from.linksOut.push(tmpLink);
            tmpLink.to.linksIn.push(tmpLink);
            if (!tmpLink.group || tmpLink.group === "" || tmpLink.group === "default") {
                (linkGroupMap.get("default")?.children as LinkDto[]).push(tmpLink)
            }
        }
        change.value++;
    }

    // 下载数据
    const downloadData = () => {
        const nodes = Array.from(nodeMap.values()).map(convertDto2Node);
        const links = Array.from(linkMap.values()).map((convertDto2Link));
        const linkGroup = dfsConstructGroupFromDto(linkGroupRoot, 'link').children as Group[];
        const nodeGroup = dfsConstructGroupFromDto(nodeGroupRoot, 'node').children as Group[];
        const data: Data = {
            nodes: nodes,
            links: links,
            nodeGroups: nodeGroup,
            linkGroups: linkGroup,
        }
        console.log(data);
        handleDownload(data);

    }

    const initGraphData = () => {
        return {
            ns: Array.from(nodeMap.values()).map(convertNodeDto2V),
            ls: Array.from(linkMap.values()).map(convertLinkDto2V),
        }
    }

    const registerHook = (fn: DataHookFunc, hookAt: "add" | "del") => {
        switch (hookAt) {
            case 'add':
                dealWithAdd.add(fn);
                break;
            case 'del':
                dealWithDel.add(fn);
                break;
        }
    }

    const unregisterHook = (fn: DataHookFunc, hookAt: "add" | "del") => {
        switch (hookAt) {
            case 'add':
                dealWithAdd.delete(fn);
                break;
            case 'del':
                dealWithDel.delete(fn);
                break;
        }
    }

    const addNode = (node: Node) => {
        changeNode(convertNode2Dto(node), "add")
        dealWithAdd.forEach((fn) => fn([node.id], []));
    }

    const addLink = (link: Link) => {
        changeLink(convertLink2Dto(link, nodeMap), "add");
        dealWithAdd.forEach(fn => fn([], [link.id]));
    }

    const delNode = (id: string) => {
        const val = nodeMap.get(id);
        if (!val) return;
        const ins = val.linksIn.map(l => l.id);
        const outs = val.linksOut.map(l => id);
        changeNode(val, "del");
        dealWithDel.forEach(fn => fn([id], [...ins, ...outs]))
    }

    const delLink = (id: string) => {
        const val = linkMap.get(id);
        if (!val) return;
        changeLink(val, "del");
        dealWithDel.forEach(fn => fn([], [id]));
    }

    // 这里面的所有 get 方法都需要加上 undifine 的
    const getNodeV = (id: string) => {
        return convertNodeDto2V(nodeMap.get(id) as NodeDto);
    }

    const getLinkV = (id: string) => {
        return convertLinkDto2V(linkMap.get(id) as LinkDto);
    }

    const getNode = (id: string) => {
        return convertDto2Node(nodeMap.get(id) as NodeDto)
    }

    const getLink = (id: string) => {
        return convertDto2Link(linkMap.get(id) as LinkDto);
    }

    const getGroup = (type: 'link' | 'node', id?: string, withChlidren?: boolean): Group => {
        // 如果携带ID也是默认不返回 children 的，需要完整组织节点请返回 root 然后自己查找
        if (id) {
            const map = type === "link" ? linkGroupMap : nodeGroupMap;
            const group = map.get(id);
            if (!group) {
                throw Error(`No such a Group of id=${id}`)
            }
            return {
                id: group.id,
                label: group.label,
                description: group.description,
                sourceGroup: (group as any)?.sourceGroup?.id,
                targetGroup: (group as any)?.targetGroup?.id,
                children: withChlidren ? group.children.map(dto => dto.id) : [],
            }
        }
        // 没有指明ID就直接返回根节点（只包括Group，没有叶子节存储的data的id)
        const root = type === 'link' ? linkGroupRoot : nodeGroupRoot;
        return dfsConstructGroupFromDto(root, type, true, true);
    }

    return {
        // Write
        addLink,
        addNode,
        delLink,
        delNode,
        //Read
        getNodeV,
        getLinkV,
        getGroup,
        getNode,
        getLink,

        // 通用
        loadData,
        initGraphData,
        registerHook,
        unregisterHook,
        downloadData,
        current,
        change,
    }

});