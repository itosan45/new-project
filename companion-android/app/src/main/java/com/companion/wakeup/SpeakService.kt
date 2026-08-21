package com.companion.wakeup

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.core.app.NotificationCompat
import java.util.Locale

class SpeakService : Service(), TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, buildNotification())
        tts = TextToSpeech(this, this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_NOT_STICKY
    }

    override fun onInit(status: Int) {
        if (status != TextToSpeech.SUCCESS) {
            stopSelf()
            return
        }
        tts?.language = Locale.JAPANESE
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) {
                finishAndReschedule()
            }
            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                finishAndReschedule()
            }
        })

        val prefs = getSharedPreferences(AlarmScheduler.PREFS, MODE_PRIVATE)
        val message = prefs.getString(AlarmScheduler.KEY_MESSAGE, DEFAULT_MESSAGE) ?: DEFAULT_MESSAGE
        tts?.speak(message, TextToSpeech.QUEUE_FLUSH, Bundle(), "companion_wakeup")
    }

    private fun finishAndReschedule() {
        val prefs = getSharedPreferences(AlarmScheduler.PREFS, MODE_PRIVATE)
        val hour = prefs.getInt(AlarmScheduler.KEY_HOUR, 7)
        val minute = prefs.getInt(AlarmScheduler.KEY_MINUTE, 30)
        if (prefs.getBoolean(AlarmScheduler.KEY_ENABLED, false)) {
            AlarmScheduler.scheduleNextTrigger(this, hour, minute)
        }
        stopSelf()
    }

    private fun buildNotification(): Notification {
        val channelId = "companion_wakeup_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(
                channelId, "話しかけ通知", NotificationManager.IMPORTANCE_LOW
            )
            manager.createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("話しかけています")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val NOTIFICATION_ID = 1
        private const val DEFAULT_MESSAGE = "起きろー！遅刻しちゃうよ！"
    }
}
