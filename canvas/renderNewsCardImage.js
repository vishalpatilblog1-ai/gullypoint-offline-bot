import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import {
  CATEGORY_COLOR_MAP,
  DEFAULT_COLOR,
} from "../crickbuzz/utils/config.js";

registerFont(path.resolve("./assets/fonts/Inter_28pt-Bold.ttf"), {
  family: "InterBold",
});

registerFont(path.resolve("./assets/fonts/Inter_28pt-Regular.ttf"), {
  family: "InterRegular",
});

export async function renderNewsCardImage(baseImageUrl, card) {
  const width = 1200;
  const height = 675;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 🔥 Force PNG
  const finalBaseUrl = baseImageUrl.replace("/upload/", "/upload/f_png/");

  const baseImage = await loadImage(finalBaseUrl);
  ctx.drawImage(baseImage, 0, 0, width, height);

  if (card.category?.trim()) {
    const normalizedCategory = card.category.trim().toUpperCase();
    const badgeColor = CATEGORY_COLOR_MAP[normalizedCategory] || DEFAULT_COLOR;

    ctx.font = "32px InterBold";
    ctx.textBaseline = "middle";

    const paddingX = 36;
    const boxHeight = 64;

    const pillSpacing = getPillSpacing(normalizedCategory);

    // 🔥 correct width with spacing
    const textWidth = measureTextWithSpacing(
      ctx,
      normalizedCategory,
      pillSpacing,
    );

    const boxX = 100;
    const boxY = 80;
    const boxWidth = textWidth + paddingX * 2;

    drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 20, badgeColor);

    ctx.fillStyle = "#FFFFFF";

    // 🔥 perfectly centered
    drawTextWithSpacing(
      ctx,
      normalizedCategory,
      boxX + paddingX,
      boxY + boxHeight / 2,
      pillSpacing,
    );
  }

  // ===============================
  // 📰 HEADLINE
  // ===============================
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "68px InterBold";

  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  const headlineText = card.headline || "Breaking Update";

  // const headlineLines = wrapText(ctx, headlineText, 100, 200, 750, 85) || 1;
  const headlineLines = wrapText(
    ctx,
    headlineText,
    100,
    200,
    750,
    85,
    1.6, // 🔥 spacing for headline
  );

  ctx.shadowColor = "transparent";

  // ===============================
  // 📌 SUBLINE
  // ===============================
  if (card.subline) {
    ctx.fillStyle = "#FFD54F";
    ctx.font = "42px InterRegular";

    const sublineY = 200 + headlineLines * 85 + 15;

    // wrapText(ctx, card.subline, 100, sublineY, 800, 55, 0.8);
    wrapText(
      ctx,
      card.subline,
      100,
      sublineY,
      800,
      55,
      1, // 🔥 spacing for subline
    );
  }

  return canvas.toBuffer("image/png");
}

// ===============================
// SAVE IMAGE
// ===============================
export function saveGeneratedImage(buffer) {
  try {
    fs.mkdirSync("./tmp", { recursive: true });

    const filePath = `./tmp/news_${Date.now()}.png`;

    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (err) {
    console.error("❌ Failed to save image:", err);
    return null;
  }
}

// ===============================
// HELPERS
// ===============================
function drawRoundedRect(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fill();
}

function measureTextWithSpacing(ctx, text, letterSpacing) {
  let width = 0;

  for (let i = 0; i < text.length; i++) {
    width += ctx.measureText(text[i]).width;
    if (i < text.length - 1) width += letterSpacing;
  }

  return width;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, letterSpacing = 0) {
  const words = text.split(" ");
  let line = "";
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const testWidth =
      letterSpacing > 0
        ? measureTextWithSpacing(ctx, testLine, letterSpacing)
        : ctx.measureText(testLine).width;

    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }

  lines.push(line);

  lines.forEach((l, i) => {
    if (letterSpacing > 0) {
      drawTextWithSpacing(ctx, l.trim(), x, y + i * lineHeight, letterSpacing);
    } else {
      ctx.fillText(l.trim(), x, y + i * lineHeight);
    }
  });

  return lines.length;
}

function drawTextWithSpacing(ctx, text, x, y, letterSpacing = 1) {
  let currentX = x;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    ctx.fillText(char, currentX, y);

    const charWidth = ctx.measureText(char).width;
    currentX += charWidth + letterSpacing;
  }
}

function getPillSpacing(text) {
  const length = text.length;

  if (length <= 6) return 1.2; // 🔥 BREAKING
  if (length <= 10) return 0.9; // 🔥 MATCH REPORT
  return 0.6; // 🔥 LONG categories
}
