const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const { sendMail } = require('../../utils/email/nodeMailer'); // Import your sendMail function

async function generateCertificate(req, res, next) {
    const { name, email, fontSize, font, fontColor, imageURL } = req.body;

    // Validate request body
    if (!name || !email) {
        return next(new ApiError(400, "Missing required fields: name, email"));
    }

    try {
        const outputPath = path.resolve(__dirname, `certificate-${name}.png`); // Output path for the generated certificate

        // Load the certificate template
        const template = await loadImage(imageURL);

        // Create a canvas based on the template dimensions
        const canvas = createCanvas(template.width, template.height);
        const context = canvas.getContext('2d');

        // Draw the template image onto the canvas
        context.drawImage(template, 0, 0);

        // Set text properties
        context.font = `${fontSize}px ${font}`; // Set font size and family
        context.fillStyle = fontColor; // Set the text color
        context.textAlign = 'center'; // Center the text horizontally

        // Calculate the center position for the text
        const textWidth = context.measureText(name).width;
        const centerX = template.width / 2;
        const y = req.body.y;

        // Add the name text at the calculated position
        context.fillText(name, centerX, y);

        // Save the canvas as an image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        console.log(`Certificate saved at: ${outputPath}`);

        // Send the certificate as an email attachment
        if (req.body.sendMail) {
            const attachment = [
                {
                    filename: `certificate-${name}.png`,  // Use the generated certificate filename
                    content: buffer,  // Make sure content is a Buffer
                    encoding: 'base64'  // Ensure content is sent as base64
                }
            ];
            await sendMail(
                email,
                "Your Certificate",
                "Congratulations! Your certificate has been generated.",
                "Please find your certificate attached.",
                attachment
            );
        }
        const base64Image = buffer.toString('base64');
        const imageSrc = `data:image/png;base64,${base64Image}`;

        console.log("Certificate sent via email.");
        res.status(200).json({
            success: true,
            message: 'Certificate generated and sent successfully.',
            base64:imageSrc
        });
    } catch (error) {
        console.error('Error generating certificate:', error);
        return next(new ApiError(500, 'Error generating certificate', error));
    }
}

module.exports = { generateCertificate };
