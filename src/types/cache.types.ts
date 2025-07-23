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

export type {
    NodeDto,
    LinkDto,
    GroupDto,
    LinkGroup,
    NodeGroup,
}