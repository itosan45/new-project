plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.companion.wakeup"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.companion.wakeup"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1"

        val companionApiBaseUrl = (project.findProperty("companionApiBaseUrl") as String?) ?: ""
        val companionSharedSecret = (project.findProperty("companionSharedSecret") as String?) ?: ""
        buildConfigField("String", "COMPANION_API_BASE_URL", "\"$companionApiBaseUrl\"")
        buildConfigField("String", "COMPANION_SHARED_SECRET", "\"$companionSharedSecret\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
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
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
}
