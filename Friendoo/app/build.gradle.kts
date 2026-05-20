import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.hilt.android)
    kotlin("kapt")
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.friendoo.app"
    compileSdk = 34

    val localProperties = Properties()
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localProperties.load(localPropertiesFile.inputStream())
    }

    defaultConfig {
        applicationId = "com.friendoo.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "1.1"

        buildConfigField("String", "GEMINI_API_KEY", "\"${localProperties.getProperty("GEMINI_API_KEY") ?: ""}\"")
        buildConfigField("String", "GROQ_API_KEY", "\"${localProperties.getProperty("GROQ_API_KEY") ?: ""}\"")
        buildConfigField("String", "AGORA_APP_ID", "\"${localProperties.getProperty("AGORA_APP_ID") ?: ""}\"")
        buildConfigField("String", "AGORA_APP_CERTIFICATE", "\"${localProperties.getProperty("AGORA_APP_CERTIFICATE") ?: ""}\"")
        buildConfigField("String", "CASHFREE_APP_ID", "\"${localProperties.getProperty("CASHFREE_APP_ID") ?: ""}\"")
        buildConfigField("String", "CASHFREE_SECRET_KEY", "\"${localProperties.getProperty("CASHFREE_SECRET_KEY") ?: ""}\"")

        manifestPlaceholders["CASHFREE_APP_ID"] = localProperties.getProperty("CASHFREE_APP_ID") ?: ""

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            storeFile = file("../friendoo-release.keystore")
            storePassword = "your_keystore_password" // Replace with actual password
            keyAlias = "friendoo"
            keyPassword = "your_key_password" // Replace with actual password
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    
    // Navigation
    implementation(libs.androidx.navigation.compose)
    
    // Hilt
    implementation(libs.hilt.android)
    kapt(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    // Firebase
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth.ktx)
    implementation(libs.firebase.firestore.ktx)
    implementation(libs.firebase.messaging.ktx)
    implementation(libs.firebase.functions.ktx)
    implementation(libs.firebase.storage.ktx)

    // Material Icons Extended
    implementation("androidx.compose.material:material-icons-extended")
    
    // WebSocket for InsForge Realtime
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    
    // Agora
    implementation(libs.agora.rtc)
    
    // Cashfree
    implementation(libs.cashfree.pg)
    
    // Retrofit & OkHttp
    implementation(libs.retrofit)
    implementation(libs.converter.gson)
    implementation(libs.logging.interceptor)
    
    // Coil
    implementation(libs.coil.compose)
    
    // DataStore
    implementation(libs.androidx.datastore.preferences)

    // Gemini AI
    implementation(libs.generativeai)

    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
