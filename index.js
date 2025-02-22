const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const cliProgress = require("cli-progress");

const INPUT_DIR = "./input";
const OUTPUT_DIR = "./output";
const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function processImage(filePath, outputPath, progressBar) {
  const fileSize = fs.statSync(filePath).size;
  if (fileSize <= MAX_SIZE_BYTES) {
    fs.copyFileSync(filePath, outputPath);
    console.log(`Skipped (<=15MB): ${path.basename(filePath)}`);
    progressBar.increment();
    return;
  }

  let quality = 100;
  let buffer;
  
  do {
    buffer = await sharp(filePath)
      .jpeg({ quality })
      .toBuffer();
    
    quality -= 5; // Reduce quality iteratively if needed
  } while (buffer.length > MAX_SIZE_BYTES && quality > 10);

  await sharp(buffer).toFile(outputPath);
  console.log(`Processed: ${path.basename(filePath)} -> ${outputPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  progressBar.increment();
}

async function processImagesInDirectory() {
  const files = fs.readdirSync(INPUT_DIR).filter(file => file.endsWith(".jpg") || file.endsWith(".jpeg"));
  
  if (files.length === 0) {
    console.log("No images found to process.");
    return;
  }

  const progressBar = new cliProgress.SingleBar({
    format: "{bar} {percentage}% | {value}/{total} images",
    barCompleteChar: "█",
    barIncompleteChar: "-",
    hideCursor: true
  });
  
  progressBar.start(files.length, 0);

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    try {
      await processImage(inputPath, outputPath, progressBar);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  progressBar.stop();
  console.log("Processing complete. All images processed successfully!");
}

processImagesInDirectory();