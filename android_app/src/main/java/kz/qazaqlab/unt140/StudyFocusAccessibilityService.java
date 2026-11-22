package kz.qazaqlab.unt140;

import android.accessibilityservice.AccessibilityService;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Toast;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class StudyFocusAccessibilityService extends AccessibilityService {

    public static volatile boolean isFocusModeActive = false;
    public static volatile String currentLessonTitle = "ҰБТ Сабағы";
    public static volatile long focusEndTime = 0;
    
    // Focus Mode: "reminder" (friendly notification/toast - default), "strict" (overlay with easy exit), "off"
    public static volatile String focusMode = "reminder";

    private static final String CHANNEL_ID = "unt140_focus_reminders";
    private static long lastReminderTime = 0;

    // Distracting social media & game packages
    public static final Set<String> BLOCKED_PACKAGES = new HashSet<>(Arrays.asList(
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
        "com.supercell.brawlstars",
        "com.tencent.ig",
        "com.dts.freefireth",
        "com.dts.freefiremax",
        "com.roblox.client",
        "com.mobile.legends",
        "com.supercell.clashroyale",
        "com.supercell.clashofclans",
        "com.miHoYo.GenshinImpact",
        "com.subwaysurfers"
    ));

    private static StudyFocusAccessibilityService instance = null;

    public static boolean isRunning() {
        return instance != null;
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        createNotificationChannel();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Сабақ және Фокус ескертулері",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Сабақ кезінде назарды сақтауға көмектесетін ескертулер");
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isFocusModeActive) return;
        if ("off".equals(focusMode)) return;

        // Auto expire if timer elapsed
        if (focusEndTime > 0 && System.currentTimeMillis() > focusEndTime) {
            isFocusModeActive = false;
            return;
        }

        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            CharSequence rawPkg = event.getPackageName();
            if (rawPkg == null) return;
            String pkgName = rawPkg.toString();

            if (pkgName.equals(getPackageName()) || pkgName.contains("systemui") || pkgName.contains("launcher")) {
                return;
            }

            if (BLOCKED_PACKAGES.contains(pkgName)) {
                long now = System.currentTimeMillis();

                // 1. "reminder" MODE (Default: friendly reminder notification & toast, NO HARD BAN)
                if ("reminder".equals(focusMode)) {
                    if (now - lastReminderTime > 15000) { // Limit notifications to once every 15s
                        lastReminderTime = now;
                        sendFriendlyFocusNotification(currentLessonTitle);
                    }
                    return;
                }

                // 2. "strict" MODE (Shows gentle warning activity with instant 1-click dismiss)
                if ("strict".equals(focusMode)) {
                    if (now - lastReminderTime > 5000) {
                        lastReminderTime = now;
                        Intent warningIntent = new Intent(this, BlockerWarningActivity.class);
                        warningIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        warningIntent.putExtra("blocked_pkg", pkgName);
                        warningIntent.putExtra("lesson_title", currentLessonTitle);
                        warningIntent.putExtra("end_time", focusEndTime);
                        startActivity(warningIntent);
                    }
                }
            }
        }
    }

    private void sendFriendlyFocusNotification(String lesson) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent appIntent = new Intent(this, MainActivity.class);
        appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            this,
            101,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        Notification notif = builder
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle("Сабақты ұмытпаңыз: " + (lesson != null ? lesson : "ҰБТ Дайындығы"))
            .setContentText("Фокусты жоғалтпаңыз! Сабақты аяқтап, 130 балл мақсатына жетіңіз.")
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build();

        nm.notify(101, notif);
        Toast.makeText(this, "Сабақ жүріп жатыр! ҰБТ сабағын аяқтауды ұмытпаңыз.", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onInterrupt() {
    }
}
