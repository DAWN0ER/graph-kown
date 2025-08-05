import type { NodeObject, LinkObject } from "force-graph";

/**
 * 节点视图对象
 */

interface NodeVo extends NodeObject {
    id: string,
    viewName: string,
    content: string,
    style: any,
    context: any,
}

interface LinkVo extends LinkObject {
    id: string,
    source: string,
    target: string,
    style: any,
    context: any,
}

// 图对象
interface GraphVo {
    nodes: NodeVo[],
    links: LinkVo[],
}

export type {
    NodeVo,
    LinkVo,
    GraphVo,
}