package kz.qazaqlab.unt140;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class StudyFocusAccessibilityService extends AccessibilityService {

    public static volatile boolean isFocusModeActive = false;
    public static volatile String currentLessonTitle = "ҰБТ Сабағы";
    public static volatile long focusEndTime = 0;

    // Distracting social media & game packages
    public static final Set<String> DEFAULT_BLOCKED_PACKAGES = new HashSet<>(Arrays.asList(
        // Social Media & Messaging
        "com.instagram.android",
        "com.zhiliaoapp.musically",
        "com.ss.android.ugc.trill",
        "com.google.android.youtube",
        "org.telegram.messenger",
        "org.telegram.plus",
        "org.thunderdog.challegram",
        "com.vkontakte.android",
        "com.snapchat.android",
        "com.twitter.android",
        "com.facebook.katana",
        "com.instagram.barcelona",
        "com.whatsapp",
        "com.whatsapp.w4b",
        "com.pinterest",
        "com.reddit.frontpage",
        
        // Games & Entertainment
        "com.supercell.brawlstars",
        "com.tencent.ig",
        "com.dts.freefireth",
        "com.dts.freefiremax",
        "com.roblox.client",
        "com.mobile.legends",
        "com.supercell.clashroyale",
        "com.supercell.clashofclans",
        "com.miHoYo.GenshinImpact",
        "com.riotgames.league.wildrift",
        "com.activision.callofduty.shooter",
        "com.mojang.minecraftpe",
        "com.subwaysurfers",
        "com.ea.gp.fifamobile"
    ));

    private static StudyFocusAccessibilityService instance = null;

    public static boolean isRunning() {
        return instance != null;
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isFocusModeActive) return;

        // Auto expire if timer elapsed
        if (focusEndTime > 0 && System.currentTimeMillis() > focusEndTime) {
            isFocusModeActive = false;
            return;
        }

        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            CharSequence rawPkg = event.getPackageName();
            if (rawPkg == null) return;
            String pkgName = rawPkg.toString();

            // Ignore our own package and system UI
            if (pkgName.equals(getPackageName()) || pkgName.contains("systemui") || pkgName.contains("launcher")) {
                return;
            }

            if (DEFAULT_BLOCKED_PACKAGES.contains(pkgName)) {
                // Instantly block and push back
                performGlobalAction(GLOBAL_ACTION_BACK);

                Intent warningIntent = new Intent(this, BlockerWarningActivity.class);
                warningIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                warningIntent.putExtra("blocked_pkg", pkgName);
                warningIntent.putExtra("lesson_title", currentLessonTitle);
                warningIntent.putExtra("end_time", focusEndTime);
                startActivity(warningIntent);
            }
        }
    }

    @Override
    public void onInterrupt() {
    }
}
