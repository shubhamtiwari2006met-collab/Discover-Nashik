# Global Project Rule — First-Time Camera Permission Handling

1. **Trigger Permission Only On Explicit User Interaction:**
   - When a user chooses to use the camera (e.g., clicking "Take Photo" or "Click to Open Camera"), trigger the native browser/device camera permission request (`navigator.mediaDevices.getUserMedia`).
   - Never request camera permission on page load, form open, or component mounting.

2. **Granted Permission Workflow:**
   - Immediately release test stream tracks and open the camera interface.
   - Continue through the standard image capture -> preview -> validation -> upload pipeline.

3. **Denied / Blocked Permission Workflow:**
   - Catch permission errors (`NotAllowedError`, `PermissionDeniedError`).
   - Do not crash or break the application form.
   - Inform the user cleanly (e.g., via alert) that camera access can be enabled in browser/device settings.
   - Keep alternative photo options ("From Device" / "Image URL") 100% available.

4. **Already Granted Permission:**
   - Open camera directly without repeated unnecessary prompts.
