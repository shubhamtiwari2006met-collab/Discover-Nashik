# Global Project Rule — Native Browser Camera Permission Handling

1. **Native Browser Permission Dialog First:**
   - On first-time camera interaction ("Take Photo" / "Click to Open Camera"), trigger native browser camera capture (`cameraInputRef.current?.click()`).
   - Never pop up custom JavaScript error/alert dialogs before the native browser permission dialog has had the chance to run.
   - Do NOT request permission on page load or component mounting.

2. **Native Allow / Deny Flow:**
   - Allow the browser/device to display its native permission prompt (`Allow` / `Block`).
   - On `Allow`: Camera opens natively, photo captured, preview and upload pipeline continues.
   - On `Deny` (or if blocked previously in browser settings): Keep "From Device" and "Image URL" options 100% available and operational. Inform user via browser settings guidance if blocked.

3. **Already Granted Permission:**
   - Opens camera directly without repeated unnecessary prompts.
