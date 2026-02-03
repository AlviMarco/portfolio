# Proguard Rules for Hisab Pati

# Keep all Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# Keep WebView classes
-keep class android.webkit.** { *; }
-keepattributes JavascriptInterface

# Keep JavaScript-callable Java methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Kotlin Metadata for reflection
-keepattributes *Annotation*,InnerClasses,Signature,SourceFile,LineNumberTable

# Keep our application classes (explicit keep pattern)
-keep class com.hisabpati.app.** { *; }

# Keep AndroidX classes
-keep class androidx.** { *; }

# Keep Material Design classes
-keep class com.google.android.material.** { *; }

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}

# Optimization options
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# Keep source file names and line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
