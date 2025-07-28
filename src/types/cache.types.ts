interface DataDto {
    id: string;
    content: string;
    group: string;
    labels: string[];
}

interface NodeDto extends DataDto {
    viewName: string;
    linksOut: LinkDto[];
    linksIn: LinkDto[];
}

interface LinkDto extends DataDto {
    from: NodeDto;
    to: NodeDto;
}

/**
 * 树结构，三种情况：
 * - 如果是 Leaf 节点，则有 LeafData 不为空且 children 为 undefined 或 []
 * - 如果是非叶子节点，则 children 不为空且 leafData 为 undefined 或 []
 * - 如果是新节点（未指定类型的新增节点），则两者均为 undefined 或 []
 */
interface GroupDto<D extends DataDto> {
    id: string;
    label: string;
    description: string;
    parentGroup?:GroupDto<D>;
    children?: GroupDto<D>[]; // 只有非叶子节点有
    leafData?: D[]; // 只有叶子节点有
}

// 叶子节点必须有的属性
interface LinkGroup extends GroupDto<LinkDto> {
    sourceGroup?: NodeGroup;
    targetGroup?: NodeGroup;
}

// 叶子节点必须有的属性
interface NodeGroup extends GroupDto<NodeDto> {
    linkOutGroups?: LinkGroup[];
    linkInGroups?: LinkGroup[];
}

function getGroupDtoTreeType(group: NodeGroup|LinkGroup): 'leaf' | 'notLeaf' {
    // TODO 这里规范好数据结构之后再做
    const verify = group as any;
    if(verify.linkOutGroups && verify.linkInGroups && verify.leafData){
        return 'leaf'; // Node
    }
    if(verify.sourceGroup && verify.targetGroup && verify.leafData){
        return 'leaf'; // Link
    }
    // 先这么区分
    return 'notLeaf';
}

export type {
    NodeDto,
    LinkDto,
    GroupDto,
    LinkGroup,
    NodeGroup,
}

export {
    getGroupDtoTreeType,
}