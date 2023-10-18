Here's a step-by-step guide for installing the "Enable Copy-Paste & Right-Click Mouse" extension from a GitHub repository. 
Please follow these steps carefully to install it in your Browser:

### How to Install "Enable Copy-Paste & Right-Click Mouse" Extension from a ZIP File:

1. **Download the GitHub Repository:**
   - Visit the GitHub page of the "package" repository.
   - Click on the "Code" button and select "Download ZIP" to download the repository as a ZIP file.
   - Save the ZIP file to a location on your computer.

2. **Extract the ZIP File:**
   - Locate the downloaded ZIP file on your computer.
   - Right-click on the ZIP file and select "Extract All...".
   - Choose a destination folder for the extracted files and click "Extract".

3. **Open Google Chrome:**
   - Launch the Google Chrome browser on your computer.

4. **Access Extensions Settings:**
   - In the Chrome browser, type `chrome://extensions` into the address bar and press Enter.
   - This will open the Extensions page.

5. **Enable Developer Mode:**
   - In the Extensions page, look for a checkbox labeled "Developer mode" at the bottom of the page.
   - Check the "Developer mode" box. This enables developer features for extensions.

6. **Load Unpacked Extension:**
   - After enabling Developer mode, you'll see new options appear, including "Load unpacked".
   - Click on the "Load unpacked" button.

7. **Select the Extracted Folder:**
   - A file dialog will appear. Navigate to the folder where you extracted the "package" ZIP file.
   - Select the folder and click "Select Folder" or "Open".

8. **Confirm Installation:**
   - The extension will be loaded and added to Chrome. You should see its icon appear in the toolbar.
   - Now, the "Enable Copy-Paste & Right-Click Mouse" extension is successfully installed on your browser.

9. **Verify the Extension:**
   - Test the extension by copying, pasting, and right-clicking to ensure that the functionalities are working as expected.




# Downloading a Folder from GitHub

This repository contains a folder that you can download directly from GitHub or through the command line interface (CLI). Below are the instructions for both methods.

## Direct Download

1. Navigate to the folder you want to download in this repository.
2. Click on the file you want to download to view its contents.
3. Click the "Download" button (it looks like a small green button with a download icon). The file will be downloaded to your computer.

## Download Using Command Line Interface (CLI)

### Prerequisites

- [Git](https://git-scm.com/) installed on your local machine.

### Steps

1. Open your terminal or command prompt.

2. Use the following command to clone the repository to your local machine:

   ```
   git clone https://github.com/username/repository.git
   ```

   Replace `https://github.com/username/repository.git` with the URL of this repository.

3. Change your directory to the cloned repository:

   ```
   cd repository
   ```

   Replace `repository` with the name of the cloned repository.

4. Navigate to the folder you want to download:

   ```
   cd folder_name
   ```

   Replace `folder_name` with the name of the folder you want to access.

5. Use the following command to pull the latest changes from the repository:

   ```
   git pull origin main
   ```

   This ensures you have the latest version of the folder on your local machine.

6. After pulling the changes, the folder is now available on your local machine.

