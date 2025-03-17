/**
 * AI Girlfriend Generator - Image Generator Utility
 * Handles communication with the Google Generative AI API
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a couple image by adding a girlfriend to the user's photo
 * @param {string} inputImagePath - Path to the user's uploaded image
 * @param {string} prompt - User prompt for the girlfriend
 * @param {string} outputPath - Path to save the generated image
 * @returns {Promise<string>} - Path to the generated image
 */
async function generateCoupleImage(inputImagePath, prompt, outputPath) {
  try {
    // Read the input image as base64
    const imageData = fs.readFileSync(inputImagePath);
    const imageBase64 = imageData.toString("base64");
    const mimeType = getMimeType(inputImagePath);

    // Construct a more detailed prompt for better results
    const enhancedPrompt = createEnhancedPrompt(prompt);

    // Initialize the model with image generation capabilities
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["Text", "Image"],
        temperature: 0.7,
        topP: 1,
        topK: 32,
      },
    });

    // Create prompt parts with the image
    const promptParts = [
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      { text: enhancedPrompt },
    ];

    // Log the process step
    console.log(`Generating image with prompt: "${prompt}"`);

    // Generate the image
    const response = await model.generateContent(promptParts);

    // Process the response
    let imageGenerated = false;

    for (const part of response.response.candidates[0].content.parts) {
      if (part.inlineData) {
        const generatedImageData = part.inlineData.data;
        const buffer = Buffer.from(generatedImageData, "base64");
        fs.writeFileSync(outputPath, buffer);
        imageGenerated = true;
        console.log(`Image successfully generated and saved to ${outputPath}`);
      } else if (part.text) {
        console.log("AI response text:", part.text);
      }
    }

    if (!imageGenerated) {
      throw new Error("No image was generated in the response");
    }

    // Clean up the uploaded image after processing
    try {
      fs.unlinkSync(inputImagePath);
      console.log(`Cleaned up uploaded file: ${inputImagePath}`);
    } catch (cleanupError) {
      console.warn(
        `Warning: Could not delete temporary file: ${inputImagePath}`,
        cleanupError,
      );
    }

    return outputPath;
  } catch (error) {
    console.error("Error generating couple image:", error);
    throw error;
  }
}

/**
 * Create an enhanced prompt for better image generation
 * @param {string} userPrompt - The user's original prompt
 * @returns {string} - Enhanced prompt
 */
function createEnhancedPrompt(userPrompt) {
  return `Generate a realistic image that adds a beautiful girlfriend next to the person in the uploaded photo. 
The girlfriend should look natural and the edited image should maintain photorealistic quality.
${userPrompt}
Make sure both people look like they belong in the same photo, with consistent lighting, perspective, and style.
The result should look like a genuine photograph of a couple together.
The girlfriend should be looking at the camera or at the person in the photo with a natural expression.
Please keep the original background intact and maintain the overall scene composition.`;
}

/**
 * Get the MIME type based on the file extension
 * @param {string} filePath - Path to the file
 * @returns {string} - MIME type
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

module.exports = { generateCoupleImage };
