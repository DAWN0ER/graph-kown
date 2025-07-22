const generateUnique16BitUid = (() => {
    const generatedUids = new Set<string>();
    let counter = 0;
    
    // 改为：基于时间戳的动态前缀生成器
    const getTimeBasedPrefix = (): string => {
        // 获取微秒级时间戳 (Date.now() + performance.now)
        const highPrecisionTime = (
            Date.now() * 1000 + 
            Math.floor(performance.now() * 1000) % 1000
        );
        
        // 取低32位作为前缀 (8位十六进制)
        return (highPrecisionTime & 0xFFFFFFFF)
               .toString(16)
               .padStart(8, '0');
    };

    return (): string => {
        while (true) {
            // 每次生成动态获取前缀
            const timePrefix = getTimeBasedPrefix();
            const counterStr = counter.toString(16).padStart(4, '0');
            const randomSuffix = Math.floor(
                Math.random() * 0x10000
            ).toString(16).padStart(4, '0');
            
            let uid = `${timePrefix}${counterStr}${randomSuffix}`;
            
            // 大小写转换 (保持原逻辑)
            uid = uid.split('').map(char => 
                Math.random() > 0.5 ? char.toUpperCase() : char
            ).join('');
            
            if (!generatedUids.has(uid)) {
                generatedUids.add(uid);
                counter = (counter + 17) % 0x10000;
                return uid;
            }
            counter = (counter + 17) % 0x10000;
        }
    };
})();

export {
    generateUnique16BitUid,
}