// Create a context menu item that only shows up for text selections
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convertDate",
    title: "Convert Date",
    contexts: ["selection"]
  });
});

// Listen for context menu click event
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convertDate" && info.selectionText) {
    const selectedText = info.selectionText.trim();

    // Check if the selected text is a valid date
    const date = new Date(selectedText);
    if (!isNaN(date)) {
      // Convert to UTC
      const utcDate = date.toISOString();

      // Convert to IST (IST)
      const istDate = new Date(date.toLocaleString("en-US", { timeZone: "IST" }));

      // Convert to CST Central timezone time (America/Chicago)
      const centralDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));

      // Convert to New York time (America/New_York)
      const nyDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));

      // Format the dates
      const utcString = `UTC: ${utcDate}`;
      const istString = `IST: ${istDate.toISOString()}`;
      const nyString = `New York: ${nyDate.toISOString()}`;
      const centralString = `Central (US): ${centralDate.toISOString()}`;

      // Display the results
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: showConversionResults,
        args: [utcString, istString, nyString, centralString]
      });
    } else {
      alert("Selected text is not a valid date format.");
    }
  }
});

// Function to show conversion results as an alert on the page
function showConversionResults(utcString, istString, nyString, centralString) {
  alert(`${istString}\n\n${utcString}\n\n${nyString}\n\n${centralString}\n`);
}

