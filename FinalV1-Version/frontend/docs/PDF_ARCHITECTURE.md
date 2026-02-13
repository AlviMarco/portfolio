# PDF Handler Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Hisab Pati App Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ handlePrintVr()  │  │ handleExportLL() │  │ handleRepot()│  │
│  │ (Voucher)        │  │ (Ledger)         │  │ (Reports)    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│           └─────────────────────┴────────────────────┘          │
│                        │ Calls                                   │
│                        ▼                                         │
│             ┌──────────────────────┐                             │
│             │  downloadPDF() in    │                             │
│             │    App.tsx           │                             │
│             └──────────┬───────────┘                             │
│                        │ Delegates to                            │
│                        ▼                                         │
├─────────────────────────────────────────────────────────────────┤
│              PDF Handler Service Layer                           │
│              (src/utils/pdfHandler.ts)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  handlePDFDownload(jsPDF doc, string filename)         │    │
│  │  → Promise<PDFSaveResult>                              │    │
│  └──────────┬───────────────────────────────────────────┬─┘    │
│             │                                           │       │
│             ├─ Detect Platform                          │       │
│             │  if (Capacitor.isNativePlatform())        │       │
│             │                                           │       │
│         YES │ NO                                        │       │
│             │ ┌──────────────────────────────────────┐ │       │
│             │ │        WEB FLOW                       │ │       │
│             │ │ (Browser/Desktop)                    │ │       │
│             │ │                                      │ │       │
│             │ │ 1. Create blob from jsPDF            │ │       │
│             │ │ 2. Create ObjectURL                  │ │       │
│             │ │ 3. <a> link download attr            │ │       │
│             │ │ 4. Click link                        │ │       │
│             │ │ 5. Browser download dialog           │ │       │
│             │ │ 6. File in ~/Downloads               │ │       │
│             │ │ ✅ Success                           │ │       │
│             │ └──────────────────────────────────────┘ │       │
│             │                                           │       │
│             ▼                                           │       │
│  ┌──────────────────────────────────────┐              │       │
│  │    NATIVE FLOW (Android/iOS)         │              │       │
│  │    handleNativePDF()                 │              │       │
│  │                                      │              │       │
│  │  1. Convert jsPDF → Blob             │              │       │
│  │  2. FileReader → Base64              │              │       │
│  │                ▼                     │              │       │
│  │  3. Filesystem.writeFile()           │              │       │
│  │     Directory.Documents              │              │       │
│  │     /data/data/com.hisab.../Docs/    │              │       │
│  │                ▼                     │              │       │
│  │  4. Filesystem.getUri()              │              │       │
│  │     Get proper file URI              │              │       │
│  │                ▼                     │              │       │
│  │  5. OPEN ATTEMPT 1: FileOpener       │              │       │
│  │     FileOpener.open(uri, PDF)        │              │       │
│  │     ✅ Success → PDF opens           │              │       │
│  │     ❌ Fails   ↓                     │              │       │
│  │                ▼                     │              │       │
│  │  6. FALLBACK 1: Share Dialog         │              │       │
│  │     Share.share({url, title})        │              │       │
│  │     User selects: Gmail, Drive, etc. │              │       │
│  │     ✅ Success → App opens           │              │       │
│  │     ❌ Fails   ↓                     │              │       │
│  │                ▼                     │              │       │
│  │  7. FALLBACK 2: Manual Open          │              │       │
│  │     "Saved to Documents,             │              │       │
│  │      open from Files app"            │              │       │
│  │     ✅ File is saved                 │              │       │
│  │                                      │              │       │
│  │  Result: PDFSaveResult               │              │       │
│  │    - success: true/false             │              │       │
│  │    - uri: file location              │              │       │
│  │    - message: user-friendly msg      │              │       │
│  │    - opened: was it opened?          │              │       │
│  └──────────────────────────────────────┘              │       │
│                                                         │       │
│                        ◄────────────────────────────────┘       │
│                             Return Result                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Show Result
                              ▼
                    ┌──────────────────┐
                    │  Display Alert    │
                    │  Success/Error    │
                    └──────────────────┘
```

## Data Flow - Detailed

### Step 1: Generate PDF
```
App Component (e.g., handlePrintVoucher)
        │
        ├─ Create jsPDF instance
        ├─ Add text, tables, content
        ├─ Call downloadPDF(doc, filename)
        │
        ▼ (Async operation starts)
```

### Step 2: Detect Platform
```
downloadPDF() wrapper
        │
        ├─ Call handlePDFDownload(doc, filename)
        │
        └─ Convert PDF to FileReader
            ├─ pdfDoc.output('blob') → Blob
            ├─ FileReader.readAsDataURL() → Base64
            │
            └─ Platform detection
                ├─ if Capacitor.isNativePlatform()
                │   └─ Go to Native Flow
                │
                └─ else (Web)
                    └─ Go to Web Flow
```

### Step 3a: Web Flow
```
Browser/Web Platform
    │
    ├─ URLObject = URL.createObjectURL(pdfBlob)
    │
    ├─ Create <a> element
    │  ├─ href = URLObject
    │  ├─ download = "filename.pdf"
    │
    ├─ document.body.appendChild(link)
    ├─ link.click()
    ├─ document.body.removeChild(link)
    │
    ├─ Browser Shows: "Save As" dialog
    │  ├─ User selects location
    │  ├─ Browser saves file
    │
    └─ URL.revokeObjectURL(URLObject)
```

### Step 3b: Native Flow - Save to Storage
```
Android/iOS Native Platform
    │
    ├─ Convert Blob → Base64 (FileReader)
    │
    ├─ Filesystem.writeFile({
    │     path: "report.pdf",
    │     data: base64String,
    │     directory: Directory.Documents,
    │     recursive: true
    │  })
    │
    ├─ OS Saves to:
    │  │ Android: /data/data/com.hisabpati.app/files/files/Documents/
    │  │ iOS: [App]/Documents/ (via Sandbox)
    │
    ├─ ✅ Write Successful
    │
    └─ Get URI for opening
        └─ Filesystem.getUri({
             directory: Directory.Documents,
             path: "report.pdf"
           })
           
           Returns: {
             uri: "file:///data/data/com.hisabpati.app/files/..."
             (or "content://..." on some Android versions)
           }
```

### Step 4: Native Flow - Open with Fallbacks
```
Try Method 1: FileOpener
├─ FileOpener.open(uri, "application/pdf")
├─ Android: Finds PDF viewer app
├─ ✅ Success → PDF opens in app
│         └─ Return {success: true, opened: true}
│
└─ ❌ Fails: FileOpener plugin error
        │
        ├─ Log warning
        │
        ▼ Try Method 2: Share Dialog
        │
        ├─ Share.share({
        │    url: uri,
        │    title: "report.pdf",
        │    text: "Open this PDF...",
        │    dialogTitle: "Open PDF with"
        │  })
        │
        ├─ Android: Shows app chooser
        ├─ User selects: Gmail, Google Drive, Google Docs, etc.
        ├─ ✅ Success → App opens file
        │         └─ Return {success: true, opened: true}
        │
        └─ ❌ Fails: User cancelled or error
                │
                ├─ Log warning
                │
                ▼ Method 3: Manual Open
                │
                ├─ Show user message:
                │  "✅ PDF saved to Documents folder
                │   Open it from your Files app"
                │
                └─ Return {success: true, opened: false}
                   (File IS saved, even if not opened)
```

### Step 5: Return Result & Display
```
PDFSaveResult object
{
  success: true,           // Was operation successful?
  uri?: "file://...",      // File path (native only)
  message: "✅ PDF...",    // User-friendly message
  filename: "report.pdf",  // Original filename
  opened?: true            // Was it opened?
}
        │
        └─ Back to downloadPDF() wrapper in App.tsx
            │
            ├─ if (result.success)
            │     alert(result.message)  // Show success
            │
            └─ else
                  alert(`❌ ${result.message}`)  // Show error
```

## Storage Paths Comparison

### ❌ OLD (BROKEN)
```
Hardcoded path:
/storage/emulated/0/Documents/report.pdf

Problem:
- Public storage (requires MANAGE_EXTERNAL_STORAGE)
- Android 10+ blocks without permission
- Not Play Store approved
- FileOpener can't open (permission denied)
```

### ✅ NEW (FIXED)
```
Android:
/data/data/com.hisabpati.app/files/files/Documents/report.pdf

iOS (Sandboxed):
/var/mobile/Containers/Data/Documents/report.pdf

Why it works:
- App-private (no permission needed)
- Android respects this path (Scoped Storage)
- FileOpener can open this path
- iOS sandbox allows this
- Play Store approved
```

## Capacitor Filesystem API Usage

### Write (Save PDF)
```typescript
const result = await Filesystem.writeFile({
  path: "myreport.pdf",
  data: base64String,      // Base64-encoded PDF
  directory: Directory.Documents,  // ← Key: App-private
  recursive: true           // Create subdirectories if needed
});
```

### Get URI (Get file location)
```typescript
const result = await Filesystem.getUri({
  directory: Directory.Documents,
  path: "myreport.pdf"
});

const fileUri = result.uri;  // e.g., file:///data/data/com.../...
```

### Other Utilities
```typescript
// Read (text files)
const contents = await Filesystem.readFile({
  directory: Directory.Documents,
  path: "myfile.txt"
});

// Delete
await Filesystem.deleteFile({
  directory: Directory.Documents,
  path: "myfile.txt"
});

// List files
const result = await Filesystem.readdir({
  directory: Directory.Documents,
  path: ""
});
const files = result.files;  // Array of files
```

## Plugin Integration

### FileOpener (PDF Opening)
```typescript
import { FileOpener } from '@awesome-cordova-plugins/file-opener';

await FileOpener.open(
  "file:///data/data/.../report.pdf",
  "application/pdf"
);

// Android: Opens default PDF viewer
// iOS: Opens default PDF viewer
// Throws error if no viewer available
```

### Share Dialog (Fallback)
```typescript
import { Share } from '@capacitor/share';

await Share.share({
  url: "file:///data/data/.../report.pdf",
  title: "My Report",
  text: "Check this PDF",
  dialogTitle: "Open with..."
});

// Shows: "Save to Drive", "Send via Gmail", "Print", etc.
```

## Error Handling Hierarchy

```
Error occurs
    │
    ├─ Write to Filesystem
    │  ├─ Success → Continue
    │  └─ Error → Stop & Show Error
    │
    ├─ Get URI
    │  ├─ Success → Continue
    │  └─ Error → Log warning, construct path
    │
    ├─ Open with FileOpener
    │  ├─ Success → ✅ Done
    │  └─ Error → Try fallback
    │
    ├─ Open with Share
    │  ├─ Success → ✅ Done
    │  └─ Error → Try fallback
    │
    └─ Manual open (Files app)
       └─ ✅ File saved anyway
```

## Key Design Decisions

| Decision | Why |
|----------|-----|
| Use `Directory.Documents` | App-private, no permissions needed, Scoped Storage compliant |
| Get URI instead of hardcoding path | Different Android versions have different paths, Filesystem API handles it |
| Multiple open methods | Different devices/users prefer different apps, graceful degradation |
| Separate Web/Native code | Completely different APIs and UX |
| Promise-based async/await | Modern JS/TS standard, easier error handling |
| Result object | Structured return (success + details), easier for app to respond |

---

**Architecture Version:** 1.0
**Status:** Production Ready ✅
**Last Updated:** January 28, 2026
