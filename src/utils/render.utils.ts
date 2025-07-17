interface CommonConfig {
    x: number;
    y: number;
    width:number,
    height:number,
    options?: any;
}

interface TextConfig extends CommonConfig {
    text: string;
    textColor?: string,   // 文字颜色
    fontSize: number,     // 字体大小
    fontFamily: string,   // 字体
}

interface RectConfig extends CommonConfig {
    width: number;
    height: number;
    fillColor?: string;
}

interface TextRectConfig extends TextConfig, RectConfig {
    padding: number;
}

function drawTextBox(ctx: CanvasRenderingContext2D, config: TextRectConfig) {
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    const textWidth = ctx.measureText(config.text).width;
    const textHeight = config.fontSize;

    // 计算文字框尺寸
    const boxWidth = textWidth + config.padding * 2;
    const boxHeight = textHeight + config.padding * 2;

    const rrectConfig: RectConfig = {
        x: config.x - boxWidth/2,
        y: config.y - boxHeight/2,
        width: boxWidth,
        height: boxHeight,
        fillColor: config.fillColor,
    }

    // 绘制圆角矩形背景
    drawRect(ctx, rrectConfig);

    // 绘制文字
    ctx.fillStyle = config.textColor || "black";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.text,config.x,config.y,);

    return {boxWidth,boxHeight}
}

function drawRect(ctx: CanvasRenderingContext2D, config: RectConfig) {
    const { x, y, width, height, fillColor } = config;
    if (fillColor) {
        ctx.fillStyle = fillColor;
    }
    ctx.fillRect(x,y,width,height);
}

export type {
    CommonConfig,TextConfig,RectConfig,TextRectConfig
}

export {
    drawTextBox,
    drawRect
}