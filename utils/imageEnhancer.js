/**
 * AI Girlfriend Generator - Image Enhancer Utility
 * Uses Replicate's CodeFormer model to enhance generated images
 */

const Replicate = require("replicate");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

// Initialize Replicate client with API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Enhance an image using the CodeFormer model
 * @param {string} imagePath - Path to the image to enhance
 * @param {number} fidelity - CodeFormer fidelity value (0.0 to 1.0)
 * @param {string} outputPath - Path to save the enhanced image
 * @returns {Promise<string>} - Path to the enhanced image
 */
async function enhanceImage(imagePath, fidelity, outputPath) {
  try {
    // Convert fidelity to number to ensure it's not a string
    const fidelityValue = parseFloat(fidelity);

    console.log(
      `Enhancing image with CodeFormer. Fidelity: ${fidelityValue} (type: ${typeof fidelityValue})`,
    );

    // Read the image file and convert to base64
    const imageBuffer = await readFileAsync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Run the CodeFormer model with the base64 image
    const output = await replicate.run(
      "sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
      {
        input: {
          image: dataUrl,
          codeformer_fidelity: fidelityValue,
          upscale: 2,
          face_upsample: true,
          background_enhance: true,
        },
      },
    );

    // Output from Replicate is typically a URL to the generated image
    console.log("Enhancement completed. Downloading result...");
    console.log("Result URL:", output);

    // Download the enhanced image
    const response = await fetch(output);
    if (!response.ok) {
      throw new Error(
        `Failed to download enhanced image: ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();

    // Save the enhanced image
    await writeFileAsync(outputPath, Buffer.from(buffer));
    console.log(`Enhanced image saved to ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("Error enhancing image:", error);
    throw error;
  }
}

module.exports = { enhanceImage };
