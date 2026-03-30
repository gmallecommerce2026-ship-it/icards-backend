// src/services/ai.service.js
const { fal } = require("@fal-ai/client"); 
const axios = require('axios');
const { uploadFileToR2 } = require('./r2.service');

// Config Fal.ai
fal.config({
    credentials: process.env.FAL_KEY, 
});

/**
 * Helper: Tải ảnh từ URL về Buffer để upload lên R2
 */
const downloadImageToBuffer = async (url) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.data, 'binary');
};

/**
 * Quy trình Hybrid: Tạo nền Tết (Flux Schnell) -> Ghép mặt (Face Swap) -> Lưu R2
 * @param {string} userFaceUrl - URL ảnh khuôn mặt người dùng (đã có trên R2/Cloudflare)
 * @param {string} prompt - Mô tả bức ảnh mong muốn
 * @returns {Promise<object>} - Trả về URL ảnh cuối cùng trên R2 của bạn
 */
const generateHybridTetCard = async (userFaceUrl, prompt) => {
    try {
        console.log("AI Service: Đang tạo bối cảnh Tết với Flux Schnell...");
        
        const enhancedPrompt = `${prompt}, Vietnamese Tet holiday atmosphere, photorealistic, 8k, cinematic lighting, highly detailed, depth of field`;

        const bgResult = await fal.subscribe("fal-ai/flux/schnell", {
            input: {
                prompt: enhancedPrompt,
                image_size: "portrait_4_3",
                num_inference_steps: 4,
                seed: Math.floor(Math.random() * 1000000),
                enable_safety_checker: false
            },
        });

        if (!bgResult.images || !bgResult.images[0]) {
            throw new Error("Flux Schnell không trả về ảnh.");
        }
        const bgUrl = bgResult.images[0].url;

        console.log("AI Service: Đang ghép mặt...");
        const swapResult = await fal.subscribe("fal-ai/face-swap", {
            input: {
                base_image_url: bgUrl,
                swap_image_url: userFaceUrl
            }
        });

        const finalFalUrl = swapResult.image?.url || swapResult.images?.[0]?.url;

        if (!finalFalUrl) {
            throw new Error("Face Swap thất bại.");
        }

        console.log("AI Service: Đang lưu ảnh vào R2...");
        const imageBuffer = await downloadImageToBuffer(finalFalUrl);
        
        const r2Data = await uploadFileToR2(imageBuffer, 'image/jpeg');

        return {
            finalUrl: r2Data.url,
            cfKey: r2Data.key,
            tempBg: bgUrl
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        if (error.message?.includes("balance") || error.body?.detail?.includes("locked")) {
            throw new Error("EXHAUSTED_BALANCE");
        }
        throw error;
    }
};

module.exports = {
    generateHybridTetCard
};