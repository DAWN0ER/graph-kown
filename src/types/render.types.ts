import type { NodeObject, LinkObject } from "force-graph";

export interface NodeVo extends NodeObject {
    id: string,
    viewName: string,
    content: string,
    style: any,
    context: any,
}

export interface LinkVo extends LinkObject {
    id: string,
    source: string,
    target: string,
    style: any,
    context: any,
}