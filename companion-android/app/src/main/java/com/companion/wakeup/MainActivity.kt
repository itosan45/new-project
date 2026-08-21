package com.companion.wakeup

import android.Manifest
import android.app.AlarmManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TimePicker
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var timePicker: TimePicker
    private lateinit var messageInput: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        timePicker = findViewById(R.id.timePicker)
        messageInput = findViewById(R.id.messageInput)

        val prefs = getSharedPreferences(AlarmScheduler.PREFS, MODE_PRIVATE)
        timePicker.hour = prefs.getInt(AlarmScheduler.KEY_HOUR, 7)
        timePicker.minute = prefs.getInt(AlarmScheduler.KEY_MINUTE, 30)
        messageInput.setText(
            prefs.getString(AlarmScheduler.KEY_MESSAGE, "起きろー！遅刻しちゃうよ！")
        )

        requestPermissionsIfNeeded()

        findViewById<Button>(R.id.saveButton).setOnClickListener {
            saveAndSchedule()
        }
        findViewById<Button>(R.id.testButton).setOnClickListener {
            saveSettingsOnly()
            ContextCompat.startForegroundService(this, Intent(this, SpeakService::class.java))
        }
    }

    private fun requestPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 100
                )
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = getSystemService(AlarmManager::class.java)
            if (!alarmManager.canScheduleExactAlarms()) {
                Toast.makeText(
                    this, "正確な時刻に起動するため、次の画面で許可してください", Toast.LENGTH_LONG
                ).show()
                startActivity(
                    Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:$packageName")
                    )
                )
            }
        }
    }

    private fun saveSettingsOnly() {
        val prefs = getSharedPreferences(AlarmScheduler.PREFS, MODE_PRIVATE)
        prefs.edit()
            .putString(AlarmScheduler.KEY_MESSAGE, messageInput.text.toString())
            .apply()
    }

    private fun saveAndSchedule() {
        saveSettingsOnly()
        AlarmScheduler.schedule(this, timePicker.hour, timePicker.minute)
        Toast.makeText(
            this,
            "毎日 ${timePicker.hour}:${String.format("%02d", timePicker.minute)} に話しかけます",
            Toast.LENGTH_LONG
        ).show()
    }
}
