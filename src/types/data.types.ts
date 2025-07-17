interface Data {
    nodes: Node[],
    links: Link[],
    nodeGroups: Group[],
    linkGroups: Group[],
}

interface Node {
    id:string,
    content:string,
    group:string,
    labels: string[],
}

interface Link {
    id:string,
    source:string,
    target:string,
    labels: string[],
}

interface Group {
    id: string,
    style: any,
    children: Group[] | string[],
    sourceGroup?: string
    targetGroup?: string
}