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

// Add event listener to application type radio button
document.getElementById("application-type").addEventListener("change", updateDownloadDirectory);

// Function to update the download directory based on radio button
function updateDownloadDirectory() {
    console.log("Radio button clicked");
    let selectedOption = document.querySelector('input[name="option"]:checked');
    console.log("Selected option: " + selectedOption.value);
    if (selectedOption) {
        document.getElementById("download-directory").value = "/home/alex/Dropbox/prof_udem/applications/" + selectedOption.value + "/" + nameToDirectory(name);
    }
}

// Function to format the directory name given the sender's name
function nameToDirectory(name) {
    return name.toLowerCase().replace(/\s+/g, '_');
}
