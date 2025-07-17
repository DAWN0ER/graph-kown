const findDiff = <T>(big:Array<T>,small:Set<T>) => {
    return big.filter(e=>!small.has(e));
}

export {
    findDiff
}