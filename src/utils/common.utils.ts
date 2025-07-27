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
    const res = {
        id: jsonData.id,
        viewName: jsonData.viewName,
        content: jsonData.content,
        group: jsonData.group,
        labels: jsonData.labels,
        linksIn: [],
        linksOut: [],
    };
    if (!res.group || res.group === ""){
        res.group = "default";
    }
    return res;
}

const convertLink2Dto = (jsonData: Link, nodeMap: Map<string, NodeDto>): LinkDto => {

    const res = {
        id: jsonData.id,
        content: jsonData.content,
        group: jsonData.group,
        labels: jsonData.labels,
        from: nodeMap.get(jsonData.source) as NodeDto,
        to: nodeMap.get(jsonData.target) as NodeDto,
    }
    if (!res.group || res.group === ""){
        res.group = "default";
    }
    return res;
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

/**
 * DFS 构造 Group 数据
 * @param dto 
 * @param type 
 * @param includeDefault 是否包含默认组，只在根节点生效一次
 * @param abandonLeafData 是否抛弃叶子节点的leafData数据
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
    if (!filteredChildren || filteredChildren.length == 0) {
        // 也就是没有子节点了，节点直接返回
        return res;
    }

    // 递归处理 children
    let children: Group[] | string[] = [];
    // 非叶子节点
    if (dto.children) {
        children = dto.children.map((dto) => dfsConstructGroupFromDto(dto, type, includeDefault, abandonLeafData));
    }
    // 叶子节点
    else if(dto.leafData) {
        if (type === 'link') {
            res.sourceGroup = (dto as LinkGroup).sourceGroup?.id;
            res.targetGroup = (dto as LinkGroup).targetGroup?.id;
        }
        if (!abandonLeafData) children = dto.leafData.map(dto => dto.id);
    }
    res.children = children;
    return res;
}

/**
 * DFS 构造 GroupDto 数据
 * @param group Group 数据
 * @param type 节点类型
 * @param nodeMap 节点映射表
 * @param linkMap 链接映射表
 * @returns GroupDto 对象
 */
function dfsConstructDtoFromGroup(
  group: Group, 
  type: "node" | "link",
  map:Map<string,GroupDto<NodeDto | LinkDto>>,
  nodeMap?: Map<string, NodeDto>,
  linkMap?: Map<string, LinkDto>
): GroupDto<NodeDto | LinkDto> {
  const res = {
    id: group.id,
    label: group.label,
    description: group.description,
    children: []
  } as GroupDto<NodeDto | LinkDto>;

  // 处理 LinkGroup 特有属性
  if (type === "link" && group.sourceGroup !== undefined) {
    (res as any).sourceGroup = { id: group.sourceGroup } as NodeDto;
  }
  if (type === "link" && group.targetGroup !== undefined) {
    (res as any).targetGroup = { id: group.targetGroup } as NodeDto;
  }

  // 如果 children 为空，直接返回
  if (!group.children || group.children.length === 0) {
    return res;
  }

  // 判断是否为叶子节点（包含实际数据ID的数组）
  const isLeaf = typeof group.children[0] === 'string';
  
  if (isLeaf) {
    // 叶子节点，children 包含的是实际数据的 ID
    if (type === "node" && nodeMap) {
      res.leafData = group.children
        .map(id => nodeMap.get(id as string))
        .filter(dto => dto !== undefined) as (NodeDto | LinkDto)[];
    } else if (type === "link" && linkMap) {
      res.leafData = group.children
        .map(id => linkMap.get(id as string))
        .filter(dto => dto !== undefined) as (NodeDto | LinkDto)[];
    }
  } else {
    // 非叶子节点，递归处理子组
    res.children = group.children.map(child => 
      dfsConstructDtoFromGroup(child as Group, type,map, nodeMap, linkMap)
    );
    // 填充子节点的父节点引用
    res.children.forEach(child => child.parentGroup = res);
  }
  map.set(res.id, res);
  return res;
}

export { dfsConstructDtoFromGroup };

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

/**
 * 
 * @param root 开始转换的根节点
 * @param toType 转换类型：view 或 select，两者的内部成员名不一样
 * @returns 转换好的组织结构，其中 select 默认只有叶子节点可选
 */
function convertGroup(root: Group | null | undefined, toType: 'view' | 'selectLeaf' | 'selectNotLeaf'): ViewGroupNode[] | SelectGroupNode[] {
    if (!root) return [];

    if (toType === 'view') {
        return convertToViewGroup(root);
    } else if (toType === 'selectLeaf') {
        return convertToSelectGroup(root, true);
    } else if (toType === 'selectNotLeaf'){
        return convertToSelectGroup(root,false);
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
function convertToSelectGroup(group: Group, selectLeaf:boolean): SelectGroupNode[] {
    const node: SelectGroupNode = {
        value: group.id,
        label: group.label || group.id,
        selectable: group.children && group.children.length > 0 ? !selectLeaf : selectLeaf
    };

    if (group.children && group.children.length > 0) {
        node.children = group.children.map(child => convertToSelectGroup(child as Group,selectLeaf)[0]);
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