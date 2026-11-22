# -*- coding: utf-8 -*-
import os
import sys
import subprocess
import shutil

SDK_DIR = r"C:\Users\user\AppData\Local\Android\Sdk"
BUILD_TOOLS_DIR = os.path.join(SDK_DIR, "build-tools", "34.0.0")
PLATFORM_DIR = os.path.join(SDK_DIR, "platforms", "android-34")
ANDROID_JAR = os.path.join(PLATFORM_DIR, "android.jar")
JDK_BIN = r"C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\bin"

AAPT2 = os.path.join(BUILD_TOOLS_DIR, "aapt2.exe")
AAPT = os.path.join(BUILD_TOOLS_DIR, "aapt.exe")
D8 = os.path.join(BUILD_TOOLS_DIR, "d8.bat")
ZIPALIGN = os.path.join(BUILD_TOOLS_DIR, "zipalign.exe")
APKSIGNER = os.path.join(BUILD_TOOLS_DIR, "apksigner.bat")

JAVAC = os.path.join(JDK_BIN, "javac.exe")
KEYTOOL = os.path.join(JDK_BIN, "keytool.exe")

APP_DIR = r"C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform\android_app"
SRC_DIR = os.path.join(APP_DIR, "src", "main")
RES_DIR = os.path.join(SRC_DIR, "res")
JAVA_DIR = os.path.join(SRC_DIR, "java")
ASSETS_DIR = os.path.join(SRC_DIR, "assets")
MANIFEST = os.path.join(SRC_DIR, "AndroidManifest.xml")

BUILD_DIR = os.path.join(APP_DIR, "build")
COMPILED_RES_DIR = os.path.join(BUILD_DIR, "compiled_res")
GEN_DIR = os.path.join(BUILD_DIR, "gen")
CLASSES_DIR = os.path.join(BUILD_DIR, "classes")
OUTPUT_DIR = os.path.join(APP_DIR, "output")
FINAL_APK = os.path.join(OUTPUT_DIR, "UNT_140_ACADEMY.apk")
KEYSTORE = os.path.join(BUILD_DIR, "debug.keystore")

def run(cmd, desc):
    print(f"--> [STEP] {desc}...")
    res = subprocess.run(cmd, shell=True, capture_output=True, encoding='cp1251', errors='replace')
    if res.returncode != 0:
        print(f"FAILED: {desc}")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        sys.exit(1)
    return res.stdout

def main():
    os.makedirs(COMPILED_RES_DIR, exist_ok=True)
    os.makedirs(GEN_DIR, exist_ok=True)
    os.makedirs(CLASSES_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Compile resources with aapt2
    run(f'"{AAPT2}" compile --dir "{RES_DIR}" -o "{COMPILED_RES_DIR}"', "Compiling Android resources with AAPT2")

    # Collect compiled res files
    flats = [os.path.join(COMPILED_RES_DIR, f) for f in os.listdir(COMPILED_RES_DIR) if f.endswith(".flat")]
    flats_str = " ".join([f'"{f}"' for f in flats])

    # 2. Link resources with aapt2
    unaligned_res_apk = os.path.join(BUILD_DIR, "resources.apk")
    link_cmd = (
        f'"{AAPT2}" link {flats_str} -I "{ANDROID_JAR}" '
        f'--manifest "{MANIFEST}" --java "{GEN_DIR}" '
        f'-A "{ASSETS_DIR}" -o "{unaligned_res_apk}" --auto-add-overlay'
    )
    run(link_cmd, "Linking resources, assets, and generating R.java")

    # 3. Find all java files
    java_files = []
    for root, dirs, files in os.walk(JAVA_DIR):
        for f in files:
            if f.endswith(".java"):
                java_files.append(os.path.join(root, f))
    for root, dirs, files in os.walk(GEN_DIR):
        for f in files:
            if f.endswith(".java"):
                java_files.append(os.path.join(root, f))

    java_files_str = " ".join([f'"{f}"' for f in java_files])

    # 4. Compile Java sources
    javac_cmd = f'"{JAVAC}" -encoding UTF-8 -cp "{ANDROID_JAR}" -d "{CLASSES_DIR}" -source 1.8 -target 1.8 {java_files_str}'
    run(javac_cmd, "Compiling Java sources to bytecode (.class)")

    # 5. Compile bytecode to Dalvik executable (.dex) using D8
    class_files = []
    for root, dirs, files in os.walk(CLASSES_DIR):
        for f in files:
            if f.endswith(".class"):
                class_files.append(os.path.join(root, f))
    class_files_str = " ".join([f'"{f}"' for f in class_files])
    d8_cmd = f'"{D8}" --lib "{ANDROID_JAR}" --output "{BUILD_DIR}" {class_files_str}'
    run(d8_cmd, "Dexing classes into classes.dex with D8")

    # 6. Add classes.dex into unaligned_res_apk
    dex_path = os.path.join(BUILD_DIR, "classes.dex")
    shutil.copy(unaligned_res_apk, os.path.join(BUILD_DIR, "unaligned_with_dex.apk"))
    raw_apk = os.path.join(BUILD_DIR, "unaligned_with_dex.apk")
    
    # Use aapt add
    run(f'cd /d "{BUILD_DIR}" && "{AAPT}" add unaligned_with_dex.apk classes.dex', "Adding classes.dex into APK package")

    # 7. Zipalign
    aligned_apk = os.path.join(BUILD_DIR, "aligned.apk")
    if os.path.exists(aligned_apk):
        os.remove(aligned_apk)
    run(f'"{ZIPALIGN}" -v -p 4 "{raw_apk}" "{aligned_apk}"', "Zipaligning APK package")

    # 8. Create release keystore if not exists
    KEYSTORE = os.path.join(BUILD_DIR, "qazaqlab.keystore")
    if not os.path.exists(KEYSTORE):
        run(f'"{KEYTOOL}" -genkey -v -keystore "{KEYSTORE}" -storepass qazaqlab140 -alias unt140key -keypass qazaqlab140 -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=QazaqLab UNT 140,O=QazaqLab,L=Almaty,C=KZ"', "Generating QazaqLab release keystore")

    # 9. Sign APK with apksigner (v1 + v2 + v3 for maximum device compatibility)
    run(f'"{APKSIGNER}" sign --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --ks "{KEYSTORE}" --ks-pass pass:qazaqlab140 --ks-key-alias unt140key --key-pass pass:qazaqlab140 --out "{FINAL_APK}" "{aligned_apk}"', "Signing APK with apksigner (v1+v2+v3)")

    # Verify APK signature
    run(f'"{APKSIGNER}" verify --verbose "{FINAL_APK}"', "Verifying signed APK")

    # Copy to Desktop\ҰБТ
    desktop_dest = r"C:\Users\user\Desktop\ҰБТ\UNT_140_ACADEMY.apk"
    shutil.copy(FINAL_APK, desktop_dest)
    
    # Copy to platform root and public/
    root_dest = r"C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform\UNT_140_ACADEMY.apk"
    public_dest = r"C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform\public\UNT_140_ACADEMY.apk"
    shutil.copy(FINAL_APK, root_dest)
    shutil.copy(FINAL_APK, public_dest)

    size_mb = os.path.getsize(FINAL_APK) / (1024 * 1024)
    print("=====================================================================")
    print("SUCCESS! Android APK built, zipaligned, and signed successfully!")
    print(f"Output APK: {FINAL_APK} ({size_mb:.2f} MB)")
    print(f"Copied to Desktop: {desktop_dest}")
    print("=====================================================================")

if __name__ == "__main__":
    main()
