// Define the saveFile function
async function zipAndDownload(messageID, path, filename, name, address, applicationType, emailPlain, emailHTML, attachments) {
    console.log("zipAndDownload() · Path received: " + path);
    console.log("zipAndDownload() · File name received: " + filename);
    console.log("zipAndDownload() · Name: " + name);
    console.log("zipAndDownload() · Email address: " + address);
    console.log("zipAndDownload() · Application type: " + applicationType);
    console.log("zipAndDownload() · Content (plain text): " + emailPlain);
    console.log("zipAndDownload() · Content (HTML): " + emailHTML);

    // Initialize JSZip
    const zip = new JSZip();

    // Create multiple text files and add to ZIP
    zip.folder(filename).file("name.txt", name + "\n");
    zip.folder(filename).file("address.txt", address + "\n");
    zip.folder(filename).file("applicationtype.txt", applicationType + "\n");
    zip.folder(filename).file("email.txt", emailPlain + "\n");
    zip.folder(filename).file("email.html", emailHTML + "\n");
    zip.folder(filename).file("outputdir.txt", path + "\n");

    // Add attachments to ZIP file
    if (attachments.length > 0) {
        for (const attachment of attachments) {
            try {
                const file = await browser.messages.getAttachmentFile(
                    messageID,
                    attachment.partName
                );
                const arrayBuffer = await file.arrayBuffer();
                zip.folder(filename).file(attachment.name, arrayBuffer);
            } catch (error) {
                console.error(`Failed to download attachment: ${attachment.name}`, error);
            }
        }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    console.log("Zip blob size:", zipBlob.size);
    if (zipBlob.size === 0) {
        console.error("Zip blob is empty");
        return;
    }

    try {
        let zipURL = URL.createObjectURL(zipBlob);
        console.log("Zip URL created:", zipURL);

        // Trigger the download with the option to choose the location
        let downloadId = await browser.downloads.download({
            url: zipURL,
            filename: filename + ".zip",
            saveAs: true  // This will prompt the user to choose where to save the file
        });

        console.log("Download started, ID:", downloadId);
    } catch (error) {
        console.error("Error downloading file:", error);
    }
}

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background listener · Message received");
    if (message.action === "zipAndDownload") {
        zipAndDownload(
            message.messageID,
            message.path,
            message.filename,
            message.name,
            message.address,
            message.applicationType,
            message.contentPlain,
            message.contentHTML,
            message.attachments,
        ).then(() => {
            sendResponse({ status: "success" });
        }).catch(error => {
            sendResponse({ status: "error", error: error.message });
        });
        return true;  // Keep the message channel open for async response
    }
});

