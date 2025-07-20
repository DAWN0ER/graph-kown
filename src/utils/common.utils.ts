import type { Group, Node, Link } from "@/types/data.types";
import type { NodeVo, LinkVo } from "@/types/render.types";
import type { NodeDto, LinkDto, LinkGroup, NodeGroup, GroupDto } from "@/types/cache.types";

const handleDownload = (data: any) => {
    // 将 JSON 对象转换为字符串
    const jsonString = JSON.stringify(data, null, 2); // 缩进为 2 个空格

    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 生成下载链接
    const url = URL.createObjectURL(blob);

    // 创建隐藏的 a 标签
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json'; // 文件名
    a.click();

    // 释放 URL 对象
    URL.revokeObjectURL(url);
};


// 类型转换工具
const convertNode2Dto = (jsonData: Node): NodeDto => {
    return {
        id: jsonData.id,
        viewName: jsonData.viewName,
        content: jsonData.content,
        group: jsonData.group,
        labels: jsonData.labels,
        linksIn: [],
        linksOut: [],
    }
}

const convertLink2Dto = (jsonData: Link, nodeMap: Map<string, NodeDto>): LinkDto => {

    return {
        id: jsonData.id,
        content: jsonData.content,
        group: jsonData.group,
        labels: jsonData.labels,
        from: nodeMap.get(jsonData.source) as NodeDto,
        to: nodeMap.get(jsonData.target) as NodeDto,
    }
}

const convertNodeDto2V = (node: NodeDto): NodeVo => {
    return {
        id: node.id,
        viewName: node.viewName,
        content: node.content,
        context: {},
        style: {},
    }
}

const convertLinkDto2V = (link: LinkDto): LinkVo => {
    return {
        id: link.id,
        source: link.from.id,
        target: link.to.id,
        context: {},
        style: {},
    }
}

const convertDto2Node = (dto: NodeDto): Node => {
    return {
        id: dto.id,
        viewName: dto.viewName,
        content: dto.content,
        group: dto.group,
        labels: dto.labels,
    }
}

const convertDto2Link = (dto: LinkDto): Link => {
    return {
        id: dto.id,
        content: dto.content,
        group: dto.group,
        labels: dto.labels,
        source: dto.from.id,
        target: dto.to.id,
    }
}

// 判断是否为 LinkGroup 数组
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

/**
 * DFS 构造 Group 数据
 * @param dto 
 * @param type 
 * @param includeDefault 是否包含默认组，只在根节点生效一次
 * @param abandonLeafData 是否抛弃叶子节点的Children [ids] 数据
 * @returns 
 */
function dfsConstructGroupFromDto(dto: GroupDto<LinkDto | NodeDto>, type: "node" | "link",
    includeDefault?: boolean, abandonLeafData?: boolean): Group {
    const res = {
        id: dto.id,
        label:dto.label,
        description: dto.description,
        children: [],
    } as Group

    // 过滤默认组
    let filteredChildren: any = dto.children;
    if (!includeDefault) {
        console.log("过滤了默认数值")
        if (dto.id === "node_group_root" || dto.id === "link_group_root") {
            filteredChildren = filteredChildren.filter((dto: { id: string; }) => dto.id !== 'default');
        }
    }
    if (filteredChildren.length == 0) {
        // 也就是没有子节点了，节点直接返回
        return res;
    }

    // 递归处理 children
    const isNotLeaf = type === "node" ? isNodeGroupArray : isLinkGroupArray;
    let children: Group[] | string[] = [];
    // 非叶子节点
    if (isNotLeaf(dto.children)) {
        children = dto.children.map((dto) => dfsConstructGroupFromDto(dto, type, includeDefault, abandonLeafData));
    }
    // 叶子节点，如果子节点数组为空，也默认是叶子节点
    else {
        if (type === 'link') {
            res.sourceGroup = (dto as LinkGroup).sourceGroup?.id;
            res.targetGroup = (dto as LinkGroup).targetGroup?.id;
        }
        if (!abandonLeafData) children = dto.children.map(dto => dto.id);
    }
    res.children = children;
    return res;
}

interface ViewGroupNode {
    title: string;
    key: string;
    children?: ViewGroupNode[];
}

interface SelectGroupNode {
    value: string;
    label: string;
    selectable: boolean;
    children?: SelectGroupNode[];
}

function convertGroup(root: Group | null | undefined, toType: 'view' | 'select'): ViewGroupNode[] | SelectGroupNode[] {
    if (!root) return [];

    if (toType === 'view') {
        return convertToViewGroup(root);
    } else if (toType === 'select') {
        return convertToSelectGroup(root);
    } else {
        throw new Error('Invalid toType. Must be "view" or "select".');
    }
}

/**
 * {
 *  title 显示名称
 *  key GourpId
 *  children 子节点
 *  selectable 是否可选择
 *  isLeaf loadData 的时候用暂时没用
 * } 
 */
function convertToViewGroup(group: Group): ViewGroupNode[] {
    const node: ViewGroupNode = {
        title: group.label || group.id,
        key: group.id
    };

    if (group.children && group.children.length > 0) {
        node.children = group.children.map(child => convertToViewGroup(child as Group)[0]);
    }

    return [node];
}

/**
 * value GroupId
 * label 显示名称
 * selectable: 是否可选
 * children 子节点
 */
function convertToSelectGroup(group: Group): SelectGroupNode[] {
    const node: SelectGroupNode = {
        value: group.id,
        label: group.label || group.id,
        selectable: group.children && group.children.length > 0 ? false : true
    };

    if (group.children && group.children.length > 0) {
        node.children = group.children.map(child => convertToSelectGroup(child as Group)[0]);
    }

    return [node];
}

export {
    handleDownload,
    convertLink2Dto,
    convertNode2Dto,
    convertLinkDto2V,
    convertNodeDto2V,
    convertDto2Link,
    convertDto2Node,
    dfsConstructGroupFromDto,
    convertGroup,
}