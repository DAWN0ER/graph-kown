/**
 * 本地无碰撞16位UID生成器（适用于量级<1000）
 * 特点：生成速度极快、本地绝对不重复、16位长度
 */
const generateUnique16BitUid = (() => {
    // 本地缓存已生成的UID，确保不重复（闭包存储，仅当前函数可见）
    const generatedUids = new Set<string>();
    // 计数器：辅助生成唯一值，提升速度
    let counter = 0;

    // 生成基础随机前缀（固定长度8位，仅初始化一次，提升速度）
    const randomPrefix = (() => {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0].toString(16).padStart(8, '0').slice(-8);
    })();

    return (): string => {
        // 循环生成，直到找到未使用的UID（量级<1000时几乎一次命中）
        while (true) {
            // 核心：计数器+随机前缀组合（确保唯一性）
            // 计数器转16进制（4位）+ 随机前缀（8位）+ 随机后缀（4位）= 16位
            const counterStr = counter.toString(16).padStart(4, '0').slice(-4);
            const randomSuffix = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0').slice(-4);
            let uid = `${counterStr}${randomPrefix}${randomSuffix}`;

            // 随机大小写转换（不影响唯一性，仅增强格式随机性）
            uid = uid.split('').map(char => 
                Math.random() > 0.5 ? char.toUpperCase() : char
            ).join('');

            // 检查是否已存在，不存在则缓存并返回
            if (!generatedUids.has(uid)) {
                generatedUids.add(uid);
                counter = (counter + 1) % 0x10000; // 计数器循环（0-65535）
                return uid;
            }

            // 极端情况：若随机后缀重复，计数器+1后重试（量级<1000时几乎不会触发）
            counter = (counter + 1) % 0x10000;
        }
    };
})();

export {
    generateUnique16BitUid,
}