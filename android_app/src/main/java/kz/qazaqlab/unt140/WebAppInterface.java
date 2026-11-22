package kz.qazaqlab.unt140;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

public class WebAppInterface {
    private final Context mContext;

    public WebAppInterface(Context context) {
        this.mContext = context;
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public boolean isAccessibilityServiceRunning() {
        return StudyFocusAccessibilityService.isRunning();
    }

    @JavascriptInterface
    public void openAccessibilitySettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            mContext.startActivity(intent);
            Toast.makeText(mContext, "«UNT 140 Сабақ және Фокус Бұғаттауышын» тауып, қосыңыз", Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(mContext, "Баптауларды ашу мүмкін болмады: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @JavascriptInterface
    public void setFocusMode(String mode) {
        if ("strict".equalsIgnoreCase(mode) || "reminder".equalsIgnoreCase(mode) || "off".equalsIgnoreCase(mode)) {
            StudyFocusAccessibilityService.focusMode = mode.toLowerCase();
            Toast.makeText(mContext, "Фокус режимі: " + ("reminder".equals(mode) ? "Жұмсақ ескерту" : "strict".equals(mode) ? "Қатаң режим" : "Өшірулі"), Toast.LENGTH_SHORT).show();
        }
    }

    @JavascriptInterface
    public String getFocusMode() {
        return StudyFocusAccessibilityService.focusMode;
    }

    @JavascriptInterface
    public void startFocusSession(String lessonTitle, int durationMinutes) {
        StudyFocusAccessibilityService.isFocusModeActive = true;
        StudyFocusAccessibilityService.currentLessonTitle = (lessonTitle != null && !lessonTitle.isEmpty()) ? lessonTitle : "ҰБТ Сабағы";
        if (durationMinutes > 0) {
            StudyFocusAccessibilityService.focusEndTime = System.currentTimeMillis() + (durationMinutes * 60L * 1000L);
        } else {
            StudyFocusAccessibilityService.focusEndTime = 0; // manual stop
        }
        Toast.makeText(mContext, "Фокус режимі іске қосылды! Әлеуметтік желілер мен ойындар бұғатталды.", Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void stopFocusSession() {
        StudyFocusAccessibilityService.isFocusModeActive = false;
        Toast.makeText(mContext, "Сабақ аяқталды. Қосымшалар бұғаттан шығарылды.", Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void showToast(String msg) {
        Toast.makeText(mContext, msg, Toast.LENGTH_SHORT).show();
    }
}
