# ProGuard rules for Friendoo

# Hilt
-keep class com.friendoo.app.** { *; }

# Retrofit / OkHttp
-keepattributes Signature, InnerClasses, AnnotationDefault
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-keepnames class com.fasterxml.jackson.** { *; }
-keepnames class retrofit2.** { *; }
-keepclassmembers class * {
    @retrofit2.http.* <methods>;
}

# Gemini AI
-keep class com.google.ai.client.generativeai.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
