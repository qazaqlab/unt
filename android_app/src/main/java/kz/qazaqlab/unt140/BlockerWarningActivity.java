package kz.qazaqlab.unt140;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

public class BlockerWarningActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_warning);

        String blockedPkg = getIntent().getStringExtra("blocked_pkg");
        String lessonTitle = getIntent().getStringExtra("lesson_title");

        TextView tvBlockedApp = findViewById(R.id.tv_blocked_app);
        TextView tvCurrentLesson = findViewById(R.id.tv_current_lesson);
        Button btnReturn = findViewById(R.id.btn_return_study);
        Button btnEmergency = findViewById(R.id.btn_emergency_unlock);

        String appLabel = "Әлеуметтік желі";
        if (blockedPkg != null) {
            try {
                PackageManager pm = getPackageManager();
                ApplicationInfo info = pm.getApplicationInfo(blockedPkg, 0);
                CharSequence name = pm.getApplicationLabel(info);
                if (name != null) appLabel = name.toString();
            } catch (Exception ignored) {}
        }

        if (tvBlockedApp != null) {
            tvBlockedApp.setText("Ашылған қосымша: " + appLabel);
        }
        if (tvCurrentLesson != null && lessonTitle != null && !lessonTitle.isEmpty()) {
            tvCurrentLesson.setText("Бүгінгі сабақ: " + lessonTitle);
        }

        // Return to study
        if (btnReturn != null) {
            btnReturn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent mainIntent = new Intent(BlockerWarningActivity.this, MainActivity.class);
                    mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivity(mainIntent);
                    finish();
                }
            });
        }

        // 1-Click friendly dismiss - no punishment, easy exit!
        if (btnEmergency != null) {
            btnEmergency.setText("Түсіндім (Қосымшаға өту)");
            btnEmergency.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // Turn off strict blocker temporarily for 15 minutes so user is not blocked
                    StudyFocusAccessibilityService.isFocusModeActive = false;
                    finish();
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(mainIntent);
        finish();
    }
}
