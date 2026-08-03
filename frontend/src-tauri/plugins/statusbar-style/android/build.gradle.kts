plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    compileSdk = 36
    namespace = "com.jbmidia.zero_grau.statusbarstyle"
    defaultConfig {
        minSdk = 24
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation(project(":tauri-android"))
}
