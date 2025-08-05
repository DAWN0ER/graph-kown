import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { LinkVo, NodeVo } from '@/types/render.types';
import type { Link, Node, Data, Group } from '@/types/data.types';
import { convertDto2Link, convertDto2Node, convertLink2Dto, convertLinkDto2V, convertNode2Dto, convertNodeDto2V, dfsConstructDtoFromGroup, dfsConstructGroupFromDto, handleDownload } from '@/utils/common.utils';
import { isGroupDtoLeaf, type LinkDto, type LinkGroup, type NodeDto, type NodeGroup } from '@/types/cache.types';

/**
 * 缓存数据模型，最底层的数据结构，所有数据的最基础依赖。
 */

type DataHookFunc = (nodes: string[], links: string[]) => void
type DataUpdateFunc = (id: string, type: 'node' | 'link', data: any) => void

export const useDataSotre = defineStore('dataBase', () => {

    const nodeMap = new Map<string, NodeDto>();
    const linkMap = new Map<string, LinkDto>();
    const nodeGroupMap = new Map<string, NodeGroup>();
    const linkGroupMap = new Map<string, LinkGroup>();

    const nodeGroupRoot = reactive({ id: "node_group_root", label: "root", description: "根节点", children: [] as NodeGroup[] } as NodeGroup)
    const linkGroupRoot = reactive({ id: "link_group_root", label: "root", description: "根节点", children: [] as LinkGroup[] } as LinkGroup)

    // 初始化默认组
    {
        const defaultNodeGroup: NodeGroup = { id: 'default', label: "default", description: '默认节点组', parentGroup: nodeGroupRoot, leafData: [] }
        const defaultLinkGroup: LinkGroup = { id: 'default', label: "default", description: '默认链接组', parentGroup: linkGroupRoot, leafData: [] }
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
    const dealWithUpdate: Set<DataUpdateFunc> = new Set();

    // 这里是观测渲染视图变更用的计数器
    // Decrepeted
    const change = ref<number>(0);

    // LinkGroup 链，要求 TargetGroup 和 SourceGroup 存在且一致
    // 如果为空数组，则默认渲染所有节点。
    const renderPath:string[] = [];

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
                nodeGroupMap.get(node.group)?.leafData?.push(node);
                break;
            case 'del':
                nodeMap.delete(node.id);
                const tmpI = node.linksIn;
                node.linksIn = [];
                tmpI.forEach(l => changeLink(l, "del"));
                const tmpO = node.linksOut;
                node.linksOut = [];
                tmpO.forEach(l => changeLink(l, "del"));
                const idx = nodeGroupMap.get(node.group)?.leafData?.findIndex(n => n.id === node.id);
                if (idx) nodeGroupMap.get(node.group)?.leafData?.splice(idx, 1);
                break;
        }
    }

    const changeLink = (link: LinkDto, operate: "add" | "del") => {
        switch (operate) {
            case 'add':
                linkMap.set(link.id, link);
                link.from.linksOut.push(link);
                link.to.linksIn.push(link);
                linkGroupMap.get(link.group)?.leafData?.push(link);
                break;
            case 'del':
                linkMap.delete(link.id);
                link.to.linksIn.splice(link.to.linksIn.findIndex(e => e.id === link.id), 1);
                link.from.linksOut.splice(link.from.linksOut.findIndex(e => e.id === link.id), 1);
                const idx = linkGroupMap.get(link.group)?.leafData?.findIndex(l => l.id === link.id);
                if (idx) linkGroupMap.get(link.group)?.leafData?.splice(idx, 1);
                break;
        }
    }

    /// -------------- EXPORT ---------------------

    const loadData = async (temp: Data) => {
        console.log("loading nodes");
        for (let ele of temp.nodes) {
            const tmpNode = convertNode2Dto(ele);
            nodeMap.set(tmpNode.id, tmpNode);
            // 默认组别填充
            if (!tmpNode.group || tmpNode.group === "" || tmpNode.group === "default") {
                (nodeGroupMap.get("default")?.leafData as NodeDto[]).push(tmpNode)
            }
        }
        console.log("loading links");
        for (let ele of temp.links) {
            const tmpLink = convertLink2Dto(ele, nodeMap);
            linkMap.set(tmpLink.id, tmpLink);
            tmpLink.from.linksOut.push(tmpLink);
            tmpLink.to.linksIn.push(tmpLink);
            // 默认组别填充
            if (!tmpLink.group || tmpLink.group === "" || tmpLink.group === "default") {
                (linkGroupMap.get("default")?.leafData as LinkDto[]).push(tmpLink)
            }
        }
        console.log("loading node groups");
        for (let ele of temp.nodeGroups) {
            const tmpNodeGroup = dfsConstructDtoFromGroup(ele, 'node', nodeGroupMap, nodeMap, undefined) as NodeGroup;
            tmpNodeGroup.parentGroup = nodeGroupRoot;
            (nodeGroupRoot.children as NodeGroup[]).push(tmpNodeGroup);
        }
        console.log("loading link groups");
        for (let ele of temp.linkGroups) {
            const tmpLinkGroup = dfsConstructDtoFromGroup(ele, 'link', linkGroupMap, undefined, linkMap) as LinkGroup;
            tmpLinkGroup.parentGroup = linkGroupRoot;
            linkGroupMap.set(tmpLinkGroup.id, tmpLinkGroup);
            (linkGroupRoot.children as LinkGroup[]).push(tmpLinkGroup);
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

    // 全节点渲染视图加载
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

    const registerUpdateHook = (fn: DataUpdateFunc) => {
        dealWithUpdate.add(fn);
    }

    const unregisterUpdateHook = (fn: DataUpdateFunc) => {
        dealWithUpdate.delete(fn);
    }

    const addNode = (node: Node) => {
        changeNode(convertNode2Dto(node), "add")
        dealWithAdd.forEach((fn) => fn([node.id], []));
    }

    const addLink = (link: Link) => {
        changeLink(convertLink2Dto(link, nodeMap), "add");
        dealWithAdd.forEach(fn => fn([], [link.id]));
    }

    const addGroup = (group: Group, typeStr: "node" | "link", mountNode: string) => {
        const map = typeStr === "node" ? nodeGroupMap : linkGroupMap;
        const root = typeStr === "node" ? nodeGroupRoot : linkGroupRoot;
        const tmp: any = {
            id: group.id,
            label: group.label,
            description: group.description,
            parentGroup: root.id === mountNode ? root : map.get(mountNode)
        };
        if (!group.isLeaf) {
            tmp.children = [];
        } else {
            tmp.leafData = [];
            if (typeStr === "link") {
                if (!group.sourceGroup || !group.targetGroup) {
                    throw new Error("LinkGroup must have sourceGroup and targetGroup");
                }
                tmp.sourceGroup = map.get(group.sourceGroup);
                tmp.targetGroup = map.get(group.targetGroup);
            } else { 
                tmp.linkOutGroups = [];
                tmp.linkInGroups = [];
            }
        }
        map.set(tmp.id, tmp);
        console.log(group,mountNode,tmp.parentGroup);
        tmp.parentGroup.children.push(tmp);
    }

    const delNode = (id: string) => {
        const val = nodeMap.get(id);
        if (!val) return;
        const ins = val.linksIn.map(l => l.id);
        const outs = val.linksOut.map(l => l.id);
        changeNode(val, "del");
        dealWithDel.forEach(fn => fn([id], [...ins, ...outs]))
    }

    const delLink = (id: string) => {
        const val = linkMap.get(id);
        if (!val) return;
        changeLink(val, "del");
        dealWithDel.forEach(fn => fn([], [id]));
    }

    // 这里的 data 暂定只包括：viewName（node）, content, labels（开发中）
    const editData = (id: string, type: "node" | "link", data: any) => {
        if (type === "node") {
            const n = nodeMap.get(id) as NodeDto;
            console.log(n);
            if (data.viewName) n.viewName = data.viewName;
            if (data.content) n.content = data.content;
            if (data.labels) n.labels = data.labels;
        } else {
            const l = linkMap.get(id) as LinkDto;
            if (data.content) l.content = data.content;
            if (data.labels) l.labels = data.labels;
        }
        dealWithUpdate.forEach(fn => fn(id, type, data));
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

    /**
     * 返回一个 Group 信息
     * @param type "link" | "node"
     * @param id group Id 可选，没有Id的时候默认返回 root
     * @param withChlidren 是否携带子节点的 Id 列表
     * @returns Group 对象
     */
    const getGroup = (type: 'link' | 'node', id?: string, withChlidren?: boolean): Group => {
        // 如果携带ID也是默认不返回 children 的，需要完整组织节点请返回 root 然后自己查找
        if (id) {
            const map = type === "link" ? linkGroupMap : nodeGroupMap;
            const group = map.get(id);
            if (!group) {
                throw Error(`No such a Group of id=${id}`)
            }
            const res = {
                id: group.id,
                label: group.label,
                description: group.description,
                sourceGroup: (group as any)?.sourceGroup?.id,
                targetGroup: (group as any)?.targetGroup?.id,
                isLeaf: isGroupDtoLeaf(group),
                children: [] as string[],
            }
            if (withChlidren) {
                if (group.children) res.children = group.children.map(child => child.id);
                else if (group.leafData) res.children = group.leafData.map(leaf => leaf.id);
            }
            return res;
        }
        // 没有指明ID就直接返回根节点（只包括Group，没有叶子节存储的data的id)
        const root = type === 'link' ? linkGroupRoot : nodeGroupRoot;
        const res = dfsConstructGroupFromDto(root, type, true, true);
        return res;
    }

    /**
     * 返回可用的 link group
     * @param path node group id
     * @returns 
     */
    const getNextAvailablePath = (node: string): {id:string, name:string}[] => { 
        return [];
    }

    const updateRenderPath = (paths:string[]): void => { 

    }

    return {
        // Write
        addLink,
        addNode,
        delLink,
        delNode,
        editData,
        addGroup,

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
        registerUpdateHook,
        unregisterUpdateHook,
        downloadData,
        current,
        change,
    }

});