import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { LinkVo, NodeVo } from '@/types/render.types';
import type { Link, Node, Data, Group } from '@/types/data.types';
import { handleDownload } from '@/utils/common.utils';

type DataHookFunc = (nodes: string[], links: string[]) => void

export const useDataSotre = defineStore('dataBase', () => {

    const nodeMap = new Map<string, NodeDto>();
    const linkMap = new Map<string, LinkDto>();
    const nodeGroupMap = new Map<string, NodeGroup>();
    const linkGroupMap = new Map<string, LinkGroup>();

    const nodeGroupRoot = reactive({ id: "node_group_root", children: [] as NodeGroup[] } as NodeGroup)
    const linkGroupRoot = reactive({ id: "link_group_root", children: [] as LinkGroup[] } as LinkGroup)

    const dealWithAdd: DataHookFunc[] = [];
    const dealWithDel: DataHookFunc[] = []; 

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

    // 类型转换工具
    const convertNode = (jsonData: Node): NodeDto => {
        return {
            id: jsonData.id,
            viewName: jsonData.viewName,
            content: jsonData.content,
            group: "default",
            labels: jsonData.labels,
            linksIn: [],
            linksOut: [],
        }
    }

    const convertLink = (jsonData: Link): LinkDto => {

        return {
            id: jsonData.id,
            content: jsonData.content,
            group: "default",
            labels: jsonData.labels,
            from: nodeMap.get(jsonData.source) as NodeDto,
            to: nodeMap.get(jsonData.target) as NodeDto,
        }
    }

    const convertNodeV = (node: NodeDto): NodeVo => {
        return {
            id: node.id,
            viewName: node.viewName,
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

    function isLinkGroupArray(children: any[]): children is LinkGroup[] {
        return children.length > 0 && children.every(child =>
            (child as LinkGroup).sourceGroup !== undefined ||
            (child as LinkGroup).targetGroup !== undefined
        );
    }

    // 判断是否为 NodeGroup 数组
    function isNodeGroupArray(children: any[]): children is NodeGroup[] {
        return children.length > 0 && children.every(child =>
            (child as NodeGroup).linkOutGroups !== undefined ||
            (child as NodeGroup).linkInGroups !== undefined
        );
    }

    // DFS 构造 Group 存储数据
    const dfsConstruct = (dto: GroupDto<LinkDto | NodeDto>,type:"node"|"link"): Group => {
        const res = {
            id: dto.id,
            description: dto.description,
            children: [],
        } as Group

        // 过滤默认组
        let filteredChildren:any = dto.children;
        if(dto.id ==="node_group_root"||dto.id==="link_group_root"){
            filteredChildren = filteredChildren.filter((dto: { id: string; })=>dto.id!=='default');
        }

        const isNotLeaf = type==="node"?isNodeGroupArray:isLinkGroupArray;
        let children:Group[]|string[] = [];
        if(filteredChildren.length==0){
            // 也就是除了默认组之外没有其他组，根节点直接返回
            return res;
        }
        // 非叶子节点
        if(isNotLeaf(dto.children)){
            children = dto.children.map((dto)=>dfsConstruct(dto,type));
        }
        // 叶子节点
        else if(type==='link') {
            res.sourceGroup = (dto as LinkGroup).sourceGroup?.id;
            res.targetGroup = (dto as LinkGroup).targetGroup?.id;
            children = dto.children.map(dto=>dto.id);
        } else {
            children = dto.children.map(dto=>dto.id);
        }
        res.children = children;
        return res;
    }

    // 数据变更工具
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
                link.to.linksIn.splice(link.to.linksIn.findIndex(e => e.id === link.id), 1);
                link.from.linksOut.splice(link.from.linksOut.findIndex(e => e.id === link.id), 1);
                break;
        }
    }

    /// -------------- EXPORT ---------------------

    const loadData = async (temp: Data) => {
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

        change.value++;
    }

       // 下载数据
    const downloadData = () => {
        const nodes = Array.from(nodeMap.values()).map((dto) => {
            return {
                id: dto.id,
                viewName: dto.viewName,
                content: dto.content,
                group: dto.group,
                labels: dto.labels,
            }
        });
        const links = Array.from(linkMap.values()).map((dto => {
            return {
                id: dto.id,
                content: dto.content,
                group: dto.group,
                labels: dto.labels,
                source: dto.from.id,
                target: dto.to.id,
            }
        }))
        const linkGroup = dfsConstruct(linkGroupRoot,'link').children as Group[];
        const nodeGroup = dfsConstruct(nodeGroupRoot,'node').children as Group[];
        const data:Data = {
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
            ns: Array.from(nodeMap.values()).map(convertNodeV),
            ls: Array.from(linkMap.values()).map(convertLinkV),
        }
    }

    const registerHook = (fn: DataHookFunc, hookAt: "add" | "del") => {
        switch (hookAt) {
            case 'add':
                dealWithAdd.push(fn);
                break;
            case 'del':
                dealWithDel.push(fn);
                break;
        }
    }

    const addNode = (node: Node) => {
        changeNode(convertNode(node), "add")
        dealWithAdd.forEach((fn) => fn([node.id], []));
    }

    const addLink = (link: Link) => {
        changeLink(convertLink(link), "add");
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

    const getNodeV = (id: string) => {
        return convertNodeV(nodeMap.get(id) as NodeDto);
    }

    const getLinkV = (id: string) => {
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
        downloadData,
        current,
        change,
    }

});