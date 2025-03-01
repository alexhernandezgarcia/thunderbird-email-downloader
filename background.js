// Define the saveFile function
async function zipAndDownload() {
    try {
        // Create a Blob with some text content
        let fileContent = "Hello, Thunderbird! This is a test file.";
        let blob = new Blob([fileContent], { type: "text/plain" });
        let url = URL.createObjectURL(blob);

        // Trigger the download with the option to choose the location
        let downloadId = await browser.downloads.download({
            url: url,
            filename: "example.txt",  // Default filename
            saveAs: true  // This will prompt the user to choose where to save the file
        });

        console.log("Download started, ID:", downloadId);
    } catch (error) {
        console.error("Error downloading file:", error);
    }
}

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "saveFile") {
        saveFile().then(() => {
            sendResponse({ status: "success" });
        }).catch(error => {
            sendResponse({ status: "error", error: error.message });
        });
        return true;  // Keep the message channel open for async response
    }
});

