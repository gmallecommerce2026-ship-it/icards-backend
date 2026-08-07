// src/services/canvasRender.service.js
let createCanvas, loadImage;

try {
  // Thử dùng @napi-rs/canvas (thư viện xử lý Canvas tốc độ cao cho Node.js)
  const napiCanvas = require('@napi-rs/canvas');
  createCanvas = napiCanvas.createCanvas;
  loadImage = napiCanvas.loadImage;
} catch (e1) {
  try {
    const nodeCanvas = require('canvas');
    createCanvas = nodeCanvas.createCanvas;
    loadImage = nodeCanvas.loadImage;
  } catch (e2) {
    console.warn('[canvasRender] Chưa cài đặt thư viện canvas.');
  }
}

/**
 * Hỗ trợ ngắt dòng văn bản tự động trên Canvas
 */
const wrapText = (ctx, text, maxWidth) => {
  if (!text) return [];
  const paragraphs = text.split('\n');
  const allLines = [];

  paragraphs.forEach(paragraph => {
    if (paragraph === '') {
      allLines.push('');
      return;
    }
    const words = paragraph.split(' ');
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width < maxWidth) {
        currentLine = testLine;
      } else {
        allLines.push(currentLine);
        currentLine = word;
      }
    }
    allLines.push(currentLine);
  });
  return allLines;
};

/**
 * Render trang đầu tiên của thiệp ra PNG Buffer làm ảnh đại diện OG Image
 */
const renderFirstPageToBuffer = async (firstPage, originalWidth, guestDetails) => {
  if (!createCanvas || !firstPage) {
    throw new Error('Canvas library not available or invalid firstPage data');
  }

  const canvasWidth = firstPage.canvasWidth || 800;
  const canvasHeight = firstPage.canvasHeight || 600;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // 1. Tô màu nền
  ctx.fillStyle = firstPage.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Vẽ ảnh nền (nếu có)
  if (firstPage.backgroundImage) {
    try {
      const bgImg = await loadImage(firstPage.backgroundImage);
      ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
    } catch (err) {
      console.warn('Lỗi tải ảnh nền OG Image:', err.message);
    }
  }

  // 3. Vẽ các đối tượng (Text, Image) theo thứ tự zIndex
  const items = [...(firstPage.items || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const item of items) {
    if (item.visible === false) continue;

    ctx.save();
    ctx.globalAlpha = item.opacity ?? 1;

    const centerX = item.x + item.width / 2;
    const centerY = item.y + item.height / 2;

    ctx.translate(centerX, centerY);
    if (item.rotation) {
      ctx.rotate((item.rotation * Math.PI) / 180);
    }
    ctx.translate(-centerX, -centerY);

    // Vẽ Văn bản (Text)
    if (item.type === 'text') {
      const fontSize = item.fontSize || 24;
      const fontFamily = item.fontFamily || 'Arial';
      const fontWeight = item.fontWeight || 'normal';
      const fontStyle = item.fontStyle || 'normal';

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
      ctx.fillStyle = item.color || '#333333';
      ctx.textAlign = item.textAlign || 'center';
      ctx.textBaseline = 'middle';

      // Nếu là Tên Khách Mời -> Thay bằng tên khách thật
      let textContent = item.content || '';
      if (item.isGuestName) {
        textContent = guestDetails?.name || 'Quý Khách Mời';
      }

      const lines = wrapText(ctx, textContent, item.width);
      const lineHeight = fontSize * 1.3;
      const totalHeight = lines.length * lineHeight;
      const startY = centerY - totalHeight / 2 + lineHeight / 2;

      lines.forEach((line, index) => {
        let lineX = centerX;
        if (ctx.textAlign === 'left') lineX = item.x;
        if (ctx.textAlign === 'right') lineX = item.x + item.width;

        ctx.fillText(line, lineX, startY + index * lineHeight);
      });
    }
    // Vẽ Hình ảnh (Image)
    else if (item.type === 'image' && item.url) {
      try {
        const itemImg = await loadImage(item.url);
        ctx.drawImage(itemImg, item.x, item.y, item.width, item.height);
      } catch (err) {
        console.warn('Lỗi tải ảnh item OG Image:', err.message);
      }
    }

    ctx.restore();
  }

  // Trả về PNG Buffer
  return canvas.toBuffer('image/png');
};

module.exports = {
  renderFirstPageToBuffer,
};