package kz.qazaqlab.unt140;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import java.util.Calendar;

public class StudyReminderReceiver extends BroadcastReceiver {

    public static final String CHANNEL_REMINDERS = "unt140_daily_reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        String msg = intent.getStringExtra("reminder_msg");
        if (msg == null || msg.isEmpty()) {
            msg = "Бүгінгі ҰБТ сабақтарын орындап, стрик пен XP ұпайларын сақтаңыз!";
        }

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_REMINDERS,
                "Күнделікті Сабақ Ескертулері",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Күнделікті ҰБТ сабақтарын орындауды еске салатын хабарламалар");
            nm.createNotificationChannel(channel);
        }

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            context,
            201,
            openApp,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, CHANNEL_REMINDERS);
        } else {
            builder = new Notification.Builder(context);
        }

        Notification notif = builder
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle("UNT 140 ACADEMY • Сабақ уақыты")
            .setContentText(msg)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build();

        nm.notify(201, notif);

        // Schedule next reminder for tomorrow
        scheduleNextDailyAlarms(context);
    }

    public static void scheduleNextDailyAlarms(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        // Schedule for 11:00, 16:00, 20:00
        int[] hours = { 11, 16, 20 };
        String[] messages = {
            "Бүгінгі сабақты бастайық! Күндізгі 4 тақырып: Физика, Математика, Тарих, МС.",
            "Күндізгі фокус: 1 сағаттық Помодоро сессиясымен дайындықты күшейтіңіз.",
            "Кешкі уақыт! Бүгінгі оқу күнін аяқтап, стрик ұпайын сақтаңыз."
        };

        for (int i = 0; i < hours.length; i++) {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, hours[i]);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);

            if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }

            Intent intent = new Intent(context, StudyReminderReceiver.class);
            intent.putExtra("reminder_msg", messages[i]);
            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                300 + i,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            }
        }
    }
}
