# VS Code Detection Fix for Terminator AI

## 🎯 **Quick Solution for VS Code Users**

Since VS Code doesn't always set the environment variables that Terminator checks for, here are the immediate solutions:

### **Option 1: Specify IDE Manually (Recommended)**
```bash
npx terminator-ai install --ide vscode
```

### **Option 2: Create .vscode Folder First**
```bash
mkdir .vscode
npx terminator-ai
```

### **Option 3: Use the Latest Version (0.1.1)**
The latest version includes enhanced VS Code detection:
```bash
npx terminator-ai@latest install --ide vscode
```

## 🔧 **What Was Fixed in Version 0.1.1**

### **Enhanced IDE Detection**
- ✅ Added more VS Code environment variables (`VSCODE_IPC_HOOK_CLI`)
- ✅ Added `TERM_PROGRAM` detection for VS Code
- ✅ Added PATH-based detection (looks for `Code.exe` or `code`)
- ✅ Added workspace file detection (`.vscode/settings.json`, etc.)

### **Better Error Messages**
- ✅ Clear step-by-step solutions for each IDE
- ✅ Specific VS Code guidance included
- ✅ Multiple fallback options provided

## 🚀 **Installation Commands**

### **For VS Code Users**
```bash
# Best option - specify IDE explicitly
npx terminator-ai install --ide vscode

# Alternative - create .vscode folder first
mkdir .vscode && npx terminator-ai

# Latest version with enhanced detection
npx terminator-ai@latest install --ide vscode
```

### **For Other IDEs**
```bash
# Cursor
npx terminator-ai install --ide cursor

# Windsurf
npx terminator-ai install --ide windsurf

# Claude Code
npx terminator-ai install --ide claude-code
```

## 📋 **Why VS Code Detection Fails**

VS Code doesn't consistently set environment variables in all scenarios:
- **Terminal vs Integrated Terminal**: Different variable sets
- **Windows vs macOS/Linux**: Different behavior
- **VS Code vs VS Code Insiders**: Different variable names
- **Different launch methods**: Terminal vs GUI launch

## 🎯 **Recommended Approach**

**Always specify the IDE explicitly for best results:**
```bash
npx terminator-ai install --ide vscode
```

This ensures:
- ✅ No detection ambiguity
- ✅ Correct IDE-specific configuration
- ✅ Faster installation (no detection needed)
- ✅ Reliable behavior across all platforms

## 🔄 **Testing the Fix**

After installing with the explicit IDE specification:
```bash
# Verify installation
npx terminator-ai doctor

# Should show healthy status with all components installed
```

---

**The enhanced detection in version 0.1.1 will catch more VS Code scenarios automatically, but specifying `--ide vscode` remains the most reliable approach! 🚀**
