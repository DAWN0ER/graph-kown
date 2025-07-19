const handleDownload = (data:any) => {
  // 将 JSON 对象转换为字符串
  const jsonString = JSON.stringify(data, null, 2); // 缩进为 2 个空格
  
  // 创建 Blob 对象
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // 生成下载链接
  const url = URL.createObjectURL(blob);
  
  // 创建隐藏的 a 标签
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json'; // 文件名
  a.click();
  
  // 释放 URL 对象
  URL.revokeObjectURL(url);
};

export {
    handleDownload
}