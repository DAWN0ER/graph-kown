interface DataDto {
    id: string;
    content: string;
    group: string;
    labels: string[];
}

interface NodeDto extends DataDto {
    linksOut: LinkDto[]
}

interface LinkDto extends DataDto {
    from: NodeDto;
    to: NodeDto;
}

interface GroupDto<D extends DataDto> {
    id: string;
    style: any;
    children: GroupDto<D>[] | D[];
}

// 叶子节点
interface LinkGroup extends GroupDto<LinkDto> {
    sourceGroup?: NodeGroup;
    targetGroup?: NodeGroup;
}

interface NodeGroup extends GroupDto<NodeDto> {
    linkGroups?: LinkGroup[];
}