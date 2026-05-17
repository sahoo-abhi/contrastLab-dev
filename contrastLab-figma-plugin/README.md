# WCAG Font Size Checker - Figma Plugin

A lightweight Figma plugin to analyze text layers and check WCAG accessibility compliance for font sizes.

## how to use this plugin in figma
 1.Go to Figma
 2.Figma menu (F) → Plugins → Development → Import plugin from manifest...
 3.Select the manifest.json
 4.click on wcag checker

## What It Checks

- **WCAG AA (Normal text)**: Minimum 16px


## How to Install

### Option 1: Load Locally (Development)

1. **Open Figma** in your browser and go to your Drafts or any file
2. **Plugins menu** → Select **"Development"** → **"Import plugin from manifest..."**
3. **Select manifest.json** from this folder
4. The plugin will appear in your Plugins menu

### Option 2: Publish to Community

Once you're happy with the plugin:

1. Right-click the plugin in Figma → "Edit plugin"
2. Fill in plugin details (description, icon, documentation)
3. Publish to the Figma Community

## How to Use

1. **Open Figma file** with designs you want to check
2. **Open the plugin** from the Plugins menu
3. **Click "Scan Page"** - the plugin analyzes all text layers
4. **Review results**:
   - ✓ Green badge = Passes WCAG
   - ✗ Red badge = Fails WCAG
5. **Filter results** to show only failures
6. **Click any result** to select and highlight that text in your design
7. **Make adjustments** as needed

## Project Structure

```
contrastLab-figma-plugin/
├── manifest.json       # Plugin configuration
├── code.js            # Plugin logic (runs in Figma context)
├── ui.html            # User interface (HTML/CSS/JS)
├── package.json       # Project metadata
└── README.md          # This file
```

### Files Explained

- **manifest.json**: Tells Figma how to load this plugin
  - Defines plugin name, ID, and entry points
  - Specifies required permissions

- **code.js**: The "backend" that runs in Figma's document context
  - Scans all text layers on the page
  - Checks WCAG compliance
  - Handles user interactions (select node, close plugin)

- **ui.html**: The user-facing interface
  - Pure HTML/CSS/JavaScript (no framework)
  - Displays scan results
  - Provides filtering and selection

## Development Tips

### Testing Changes

After editing any file:

1. Go back to Figma
2. Right-click the plugin → "Reload"
3. Test your changes

### Debugging

Open the browser console (F12) to see:

- Plugin console logs from `code.js` (stderr)
- UI errors from `ui.html` (normal console)

### Customization Ideas

- Add batch updates (apply minimum font sizes automatically)
- Export results as CSV
- Check contrast ratio alongside font sizes
- Add figma.ui.onmessage to toggle between AA/AAA level
- Remember user preferences across sessions
- Create presets for different design systems

## WCAG References

- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/#resize-text)
- [WCAG 2.1 Level AAA](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Font Size](https://webaim.org/articles/font_size/)

## Troubleshooting

**Plugin doesn't load?**

- Make sure manifest.json is valid JSON
- Check that code.js and ui.html exist in the same folder
- Try reloading: Right-click plugin → "Reload"

**No results showing?**

- Check if text layers have actual content
- Verify the page has text elements (not just components)
- Open browser console to see any errors

**Plugin crashes?**

- Reload the plugin
- Check browser console for error messages
- Verify manifest.json syntax

## Future Enhancements

- [ ] TypeScript migration for better type safety
- [ ] Batch font size adjustments
- [ ] Keyboard shortcuts
- [ ] Settings/preferences panel
- [ ] Integration with design tokens
- [ ] Color contrast checking
- [ ] Export audit report

## License

MIT - Feel free to modify and share

---

**Questions?** Check the Figma Plugin documentation: https://www.figma.com/plugin-docs/
