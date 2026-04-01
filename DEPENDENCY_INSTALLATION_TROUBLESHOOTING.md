# Dependency Installation Troubleshooting

## 🚨 **Issue: Installation Fails at "Installing dependencies..."**

This is the most common installation issue. Here are the causes and solutions:

## 🔍 **Common Causes**

### 1. **pnpm Not Installed or Not in PATH**
```bash
# Check if pnpm is available
pnpm --version

# If not found, install it:
npm install -g pnpm
```

### 2. **Node.js Version Too Old**
```bash
# Check Node.js version (must be >= 20)
node --version

# If < 20, upgrade Node.js from https://nodejs.org
```

### 3. **Permission Issues**
```bash
# Try running as administrator (Windows)
# or with sudo (macOS/Linux)
```

### 4. **Network/Firewall Issues**
- Corporate firewalls blocking npm/pnpm
- Proxy configuration needed
- SSL certificate issues

### 5. **Native Module Compilation Issues**
- Missing Python (required for some native modules)
- Missing Visual Studio Build Tools (Windows)
- Missing Xcode Command Line Tools (macOS)

## 🛠️ **Solutions**

### **Solution 1: Use Latest Version (v0.1.2)**
Version 0.1.2 includes automatic fallback to npm:

```bash
npx terminator-ai@latest install --ide vscode
```

### **Solution 2: Manual Installation Steps**
If automatic installation fails, follow these manual steps:

```bash
# 1. Navigate to the installation directory
cd C:\Users\netfl\OneDrive\Documents\wna-test\.terminator-package

# 2. Install dependencies manually
pnpm install

# 3. If pnpm fails, try npm
npm install

# 4. Build the package
pnpm build

# 5. If pnpm build fails, try npm
npm run build

# 6. Run the installer
node installer/dist/install.js

# 7. Go back to project root
cd ..

# 8. Verify installation
node .terminator-package/installer/dist/doctor.js
```

### **Solution 3: Prerequisites Check**
```bash
# Check Node.js version
node --version
# Should be >= 20.0.0

# Check pnpm installation
pnpm --version

# If pnpm not found, install it
npm install -g pnpm

# Check npm installation
npm --version

# Check git installation
git --version
```

### **Solution 4: Windows-Specific Fixes**

#### **Install Visual Studio Build Tools**
```powershell
# Download and install from:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

#### **Run as Administrator**
```powershell
# Right-click PowerShell and "Run as Administrator"
# Then run the installation command
```

#### **Configure npm for Corporate Networks**
```powershell
# If behind corporate proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use registry mirror
npm config set registry https://registry.npmjs.org/
```

### **Solution 5: Alternative Installation Methods**

#### **Use npm instead of pnpm**
```bash
# Edit the package.json to use npm
# Or install manually with npm commands
```

#### **Use yarn as alternative**
```bash
# Install yarn
npm install -g yarn

# Use yarn for installation
cd .terminator-package
yarn install
yarn build
```

## 🔧 **Enhanced Error Handling (v0.1.2)**

Version 0.1.2 includes:
- ✅ **Automatic npm fallback** if pnpm fails
- ✅ **Detailed error messages** with troubleshooting steps
- ✅ **Manual installation commands** provided
- ✅ **Build fallback** to npm if pnpm build fails

## 📋 **Step-by-Step Troubleshooting**

### **Step 1: Check Prerequisites**
```bash
node --version    # >= 20.0.0
pnpm --version    # Should be available
npm --version     # Should be available
git --version     # Should be available
```

### **Step 2: Try Latest Version**
```bash
npx terminator-ai@latest install --ide vscode
```

### **Step 3: Manual Installation**
If automatic fails, follow the manual steps in Solution 2.

### **Step 4: Environment Setup**
```bash
# Set up npm for corporate networks (if needed)
npm config set registry https://registry.npmjs.org/

# Clear npm cache
npm cache clean --force

# Clear pnpm cache
pnpm store prune
```

### **Step 5: Verify Installation**
```bash
node .terminator-package/installer/dist/doctor.js
```

## 🎯 **Quick Fix Commands**

### **For Windows Users**
```powershell
# Install pnpm globally
npm install -g pnpm

# Try installation again
npx terminator-ai@latest install --ide vscode

# If still fails, manual install:
cd .terminator-package
pnpm install
pnpm build
node installer/dist/install.js
cd ..
```

### **For macOS/Linux Users**
```bash
# Install pnpm
npm install -g pnpm

# Try installation
npx terminator-ai@latest install --ide vscode

# Manual fallback
cd .terminator-package
pnpm install
pnpm build
node installer/dist/install.js
cd ..
```

## 📞 **Getting Help**

If you're still having issues:

1. **Check the error message** - Look for specific error details
2. **Try manual installation** - Follow the step-by-step manual process
3. **Check system requirements** - Node.js >= 20, proper build tools
4. **Report the issue** - Include the full error message and system info

---

**Version 0.1.2 should resolve most dependency installation issues automatically! 🚀**
