// The user clicked our button, get the active tab in the current window using
// the tabs API.
let tabs = await messenger.tabs.query({ active: true, currentWindow: true });
console.log("Got tabs");

// Get the message currently displayed in the active tab, using the
// messageDisplay API. Note: This needs the messagesRead permission.
// The returned message is a MessageHeader object with the most relevant
// information.
let message = await messenger.messageDisplay.getDisplayedMessage(tabs[0].id);
console.log("Got message");

// Parse message.author to get the email and name of the sender
// Useful references:
// - https://webextension-api.thunderbird.net/en/beta-mv2/messages.html#messages-messageheader
// - https://webextension-api.thunderbird.net/en/beta-mv2/messengerUtilities.html#messengerutilities-parsemailboxstring
let authorInfo = await messenger.messengerUtilities.parseMailboxString(message.author);
console.log("Got author info");

// Update the HTML fields with the sender email and name.
let email = authorInfo[0].email;
document.getElementById("email").textContent = email;
console.log("Set email: " + email);
let name = authorInfo[0].name;
document.getElementById("name").textContent = name;
console.log("Set name: " + name);

// Get email content
let fullMessage = await messenger.messages.getFull(message.id);
console.log("Got full message");
let [emailContentPlain, emailContentHTML] = getEmailContent(fullMessage)
console.log("popup.js · Content (plain text): " + emailContentPlain);
console.log("popup.js · Content (HTML): " + emailContentHTML);

// Get attachments
const attachments = await browser.messages.listAttachments(message.id);
if (attachments.length == 0) {
    const hasAttachments = false
    document.getElementById("attachments").textContent = "None";
    console.log("No attachments found.");
} else {
    const hasAttachments = true
    document.getElementById("attachments").textContent = attachments.length;
	displayAttachments(attachments)
    console.log("The email contains " + attachments.length + " attachment(s)");
}
console.log("Attachments:")
console.log(attachments)

// Add event listener to application type radio button
document.getElementById("application-type").addEventListener("change", updateDownloadDirectory);

// Function to update the download directory based on radio button
function updateDownloadDirectory() {
    console.log("Radio button clicked");
    let selectedOption = document.querySelector('input[name="option"]:checked');
    console.log("Selected option: " + selectedOption.value);
    if (selectedOption) {
        document.getElementById("download-directory").value = "/home/alex/Dropbox/prof_udem/applications/" + selectedOption.value + "/";
    }
}

// Function to format the directory name given the sender's name
function nameToDirectory(name) {
    return name.toLowerCase().replace(/\s+/g, '_');
}

// Function to obtain the email content
function getEmailContent(message) {
	console.log("Attempting to extract email content")

    console.log("Email Body:", message);
    if (!message.parts) {
        console.log("No content found.");
        return ["", ""]
    }

    let plain = "";
    let html = "";
    for (let part of message.parts) {
        if (part.contentType.includes("text/plain")) {
            console.log("Plain text: ", part.body);
            plain = part.body;
        } else if (part.contentType.includes("text/html")) {
            console.log("HTML: ", part.body);
            html = part.body;
        } else if (part.contentType.includes("multipart/alternative") || part.contentType.includes("multipart/mixed")) {
            if (!part.parts) {
                console.log("No content found.");
                return ["", ""]
            } else {
                return getEmailContent(part)
            }
        }
    }
    return [plain, html];
}

function displayAttachments(attachments) {
    const container = document.getElementById("attachments");
    container.innerHTML = ""; // Clear previous content

    if (attachments.length > 0) {
        attachments.forEach((attachment, index) => {
            const div = document.createElement("div");
            div.classList.add("attachment-item");

            // Create checkbox
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true; // Checked by default
            checkbox.id = `attachment-checkbox-${index}`;

            // Create text input for file name
            const input = document.createElement("input");
            input.type = "text";
            input.value = attachment.name; // Set default name
            input.id = `attachment-name-${index}`;

            // Create size label (Convert bytes to MB and round to 1 decimals)
            const sizeMB = (attachment.size / (1024 * 1024)).toFixed(1);
            const sizeLabel = document.createElement("span");
            sizeLabel.textContent = `(${sizeMB} MB)`;
            sizeLabel.classList.add("attachment-size");

            // Append elements
            div.appendChild(checkbox);
            div.appendChild(input);
			div.appendChild(sizeLabel);
            container.appendChild(div);
        });
    }
}

function updateAttachments(attachments) {
    const updatedAttachments = [];

    attachments.forEach((attachment, index) => {
        const checkbox = document.getElementById(`attachment-checkbox-${index}`);
        const input = document.getElementById(`attachment-name-${index}`);

        if (checkbox && checkbox.checked) {
            updatedAttachments.push({
                ...attachment,
                name: input.value, // Update the name from the input field
            });
        }
    });

    return updatedAttachments;
}


// Add event listener to download button
document.getElementById("download-button").addEventListener("click", download);

async function download() {
    console.log("Download button clicked");
    console.log("Current directory: " + document.getElementById("download-directory").value);
	browser.runtime.sendMessage({
        action: "zipAndDownload",
        messageID: message.id,
        path: document.getElementById("download-directory").value,
        filename: nameToDirectory(name),
        name: name,
        address: email,
        contentPlain: emailContentPlain,
        contentHTML: emailContentHTML,
        attachments: updateAttachments(attachments),
    }).then(response => {
        if (response.status === "success") {
            console.log("Download started!");
        } else {
            console.error("Error:", response.error);
        }
    })
    .catch(error => console.error("Error sending message to background:", error));
}
