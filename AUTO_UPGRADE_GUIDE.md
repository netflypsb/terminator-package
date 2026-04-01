# Terminator AI - Automatic Upgrade Guide

## 🔄 **Smart Upgrade Detection**

The Terminator AI NPX installer now automatically detects and upgrades previous installations, making it seamless to transition from the old version (with UI extension and scheduling) to the new streamlined version.

## 🎯 **How It Works**

### **Automatic Detection**
When you run `npx terminator-ai install`, the installer automatically:

1. **Detects existing installation** in `.terminator-package/`
2. **Identifies old version indicators**:
   - `extensions/` directory (UI extension)
   - `mcp-servers/terminator-scheduler` (scheduling)
   - `workflows/chains/` (task chains)
   - Old hook files and skills

3. **Determines upgrade needed** based on presence of old components

### **Upgrade Process**
If an old version is detected, the installer:

1. **Runs uninstaller** to clean up old configurations
2. **Removes obsolete directories**:
   - `extensions/`
   - `mcp-servers/terminator-scheduler/`
   - `workflows/chains/`
   - `skills/planning/`, `skills/automation/`
   - `agents/scheduler/`

3. **Removes obsolete files**:
   - `workflows/on-schedule-trigger.json`
   - Old scheduling-related hooks

4. **Installs fresh streamlined version**

## 📋 **Usage Examples**

### **Automatic Upgrade (Recommended)**
```bash
npx terminator-ai install
```
*Automatically detects old version and upgrades*

### **Explicit Upgrade**
```bash
npx terminator-ai install --upgrade
```
*Forces upgrade check and installation*

### **Force Reinstall**
```bash
npx terminator-ai install --force
```
*Complete reinstall, removes everything first*

### **Help with Options**
```bash
npx terminator-ai help
```
*Shows all available options and examples*

## 🎊 **What Users See**

### **Old Version Detected**
```
🔄 Detected previous installation (version 0.1.3)
Old version contains UI extension and/or scheduling features
Upgrading to streamlined version (v0.2.1)...

🔄 Detected previous installation (version 0.1.3)
Old version contains UI extension and/or scheduling features
Upgrading to streamlined version (v0.2.1)...
✅ Old version cleaned up successfully
✅ Upgrade preparation complete
Continuing with fresh installation...
```

### **Upgrade Completed**
```
✅ Terminator AI Worker installed successfully!

🔄 Upgrade completed!
• Old UI extension and scheduling features removed
• Streamlined to core knowledge work capabilities
• All configurations preserved and updated

Next steps:
1. Restart your vscode IDE
2. Ask your AI agent: "What capabilities do you have as a Terminator?"
3. Edit .env to add API keys for Telegram/Discord/etc (optional)
```

## 🔍 **Detection Logic**

### **Old Version Indicators**
The installer checks for these indicators to determine if an upgrade is needed:

```javascript
const oldIndicators = {
  hasScheduler:    // mcp-servers/terminator-scheduler exists
  hasExtensions:   // extensions/ directory exists  
  hasChains:       // workflows/chains/ exists
  hasOldHooks:     // old hook registry format
};
```

### **Version Detection**
- Reads `package.json` from existing installation
- Compares against known old version patterns
- Determines if upgrade is needed

## 🛡️ **Safety Features**

### **Configuration Preservation**
- ✅ **MCP configurations** updated and preserved
- ✅ **API keys** in `.env` kept intact
- ✅ **IDE-specific settings** maintained
- ✅ **Custom skills/agents** preserved (if compatible)

### **Clean Removal**
- ✅ **Safe uninstall** using existing uninstaller
- ✅ **Graceful fallback** if cleanup fails
- ✅ **No data loss** - memory and configurations safe

### **Error Handling**
- ⚠️ **Cleanup warnings** don't stop installation
- 🔄 **Continues with fresh install** if cleanup has issues
- 📝 **Clear error messages** for troubleshooting

## 🎯 **Upgrade Scenarios**

### **Scenario 1: Old Version with UI Extension**
```
User has: v0.1.3 with extensions/terminator-panel/
Result: UI extension removed, streamlined version installed
```

### **Scenario 2: Old Version with Scheduling**
```
User has: v0.1.3 with terminator-scheduler MCP server
Result: Scheduler removed, streamlined version installed
```

### **Scenario 3: Old Version with Both**
```
User has: v0.1.3 with UI extension + scheduling
Result: Both removed, streamlined version installed
```

### **Scenario 4: Current Version**
```
User has: v0.2.0 (already streamlined)
Result: No upgrade needed, use --upgrade to force
```

## 📦 **Package Versions**

| Version | Features | Status |
|---|---|---|
| **0.1.x** | UI Extension + Scheduling | Legacy (auto-upgraded) |
| **0.2.0** | Streamlined (no UI/scheduling) | Current |
| **0.2.1+** | Streamlined + Auto-upgrade | Latest |

## 🎉 **Benefits**

### **For Users**
- ✅ **Seamless transition** - no manual cleanup needed
- ✅ **Automatic detection** - just run install command
- ✅ **Configuration preservation** - settings kept intact
- ✅ **Clear feedback** - see exactly what's happening

### **For Developers**
- ✅ **Clean migration path** from old to new architecture
- ✅ **Reduced support burden** - automatic upgrades
- ✅ **Better user experience** - no complex migration steps

## 🔧 **Technical Implementation**

### **Key Functions**
```javascript
// Detect existing installation
await detectExistingInstallation(installPath)

// Perform upgrade cleanup
await performUpgrade(installPath)

// Check if upgrade needed
if (existingInstall.needsUpgrade || options.upgrade) {
  await performUpgrade(installPath);
}
```

### **Upgrade Flags**
- `--upgrade`: Force upgrade check
- `--force`: Complete reinstall
- Default: Auto-detect and upgrade if needed

## 🎊 **Conclusion**

The automatic upgrade system makes it effortless for users to transition from the old Terminator AI version to the new streamlined version. No manual cleanup required - just run the install command and let the installer handle everything!

**Try it now:**
```bash
npx terminator-ai install --upgrade
```

*Your existing installation will be automatically detected and upgraded! 🚀*
