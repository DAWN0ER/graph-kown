/**
 * 交互用数据结构，对外
 */
interface Data {
    nodes: Node[],
    links: Link[],
    nodeGroups: Group[],
    linkGroups: Group[],
}

interface Node {
    id:string,
    viewName:string,
    content:string,
    group:string,
    labels: string[],
}

interface Link {
    id:string,
    content:string,
    labels: string[],
    group:string,
    source:string,
    target:string,
}

interface Group {
    id: string,
    label: string,
    description: string,
    children: Group[] | string[],
    isLeaf:boolean,
    sourceGroup?: string,
    targetGroup?: string,
}

export type{
    Node,Link,Data,Group
}