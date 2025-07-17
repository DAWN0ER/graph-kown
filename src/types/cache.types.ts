interface DataDto {
    id: string;
    content: string;
    group: string;
    labels: string[];
}

interface NodeDto extends DataDto {
    linksOut: LinkDto[];
    linksIn: LinkDto[];
}

interface LinkDto extends DataDto {
    from: NodeDto;
    to: NodeDto;
}

interface GroupDto<D extends DataDto> {
    id: string;
    style: any;
    parentGroup?:GroupDto<D>;
    children: GroupDto<D>[] | D[];
}

// 非叶子节点也可能有这个
interface LinkGroup extends GroupDto<LinkDto> {
    sourceGroup?: NodeGroup;
    targetGroup?: NodeGroup;
}

// 叶子节点
interface NodeGroup extends GroupDto<NodeDto> {
    linkOutGroups?: LinkGroup[];
    linkInGroups?: LinkGroup[];
}