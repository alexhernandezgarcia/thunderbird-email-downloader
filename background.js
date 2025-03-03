// Define the saveFile function
async function zipAndDownload(path, filename, name, address, emailPlain, emailHTML) {
    console.log("zipAndDownload() · Path received: " + path);
    console.log("zipAndDownload() · File name received: " + filename);
    console.log("zipAndDownload() · Name: " + name);
    console.log("zipAndDownload() · Email address: " + address);
    console.log("zipAndDownload() · Content (plain text): " + emailPlain);
    console.log("zipAndDownload() · Content (HTML): " + emailHTML);

    // Initialize JSZip
    const zip = new JSZip();

    // Create multiple text files and add to ZIP
    zip.folder(filename).file("name.txt", name + "\n");
    zip.folder(filename).file("address.txt", address + "\n");
    zip.folder(filename).file("email.txt", emailPlain + "\n");
    zip.folder(filename).file("email.html", emailHTML + "\n");

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
            message.path,
            message.filename,
            message.name,
            message.address,
            message.contentPlain,
            message.contentHTML,
        ).then(() => {
            sendResponse({ status: "success" });
        }).catch(error => {
            sendResponse({ status: "error", error: error.message });
        });
        return true;  // Keep the message channel open for async response
    }
});

